import {
  ChatTransport,
  type UIMessageChunk,
  streamText,
  convertToModelMessages,
  type ChatRequestOptions,
  createUIMessageStream,
} from "ai"
import {
  TransformersJSLanguageModel,
  type TransformersUIMessage,
  transformersJS,
} from "@browser-ai/transformers-js"
import { useSettingsStore } from "@/stores/settings-store"
import { getLocalModelId } from "@/lib/ai/models"
import { getAvailableDevice } from "@/lib/ai/get-available-device"

export class TransformersChatTransport
  implements ChatTransport<TransformersUIMessage>
{
  model!: TransformersJSLanguageModel

  constructor(modelId?: string) {
    const storedId = useSettingsStore.getState().localAiModelId
    const id = modelId ?? storedId ?? getLocalModelId()

    // Store the promise so sendMessages can await it
    this._initPromise = this._init(id)
  }

  private _initPromise: Promise<void>

  private async _init(id: string): Promise<void> {
    const device = await getAvailableDevice()
    this.model = transformersJS(id, {
      device,
      worker: new Worker(new URL("../../app/worker.ts", import.meta.url), {
        type: "module",
      }),
    })
  }

  async sendMessages(
    options: {
      chatId: string
      messages: TransformersUIMessage[]
      abortSignal: AbortSignal | undefined
    } & {
      trigger:
        | "submit-message"
        | "submit-tool-result"
        | "regenerate-message"
      messageId: string | undefined
    } & ChatRequestOptions
  ): Promise<ReadableStream<UIMessageChunk>> {
    // Wait for model initialization (async device probe) to complete
    await this._initPromise

    const { messages, abortSignal } = options
    const prompt = await convertToModelMessages(messages)

    return createUIMessageStream<TransformersUIMessage>({
      execute: async ({ writer }) => {
        try {
          // Track download progress
          let downloadProgressId: string | undefined
          const availability = await this.model.availability()

          if (availability !== "available") {
            await this.model.createSessionWithProgress(
              (progress: number) => {
                const percent = Math.round(progress * 100)

                if (progress >= 1) {
                  if (downloadProgressId) {
                    writer.write({
                      type: "data-modelDownloadProgress",
                      id: downloadProgressId,
                      data: {
                        status: "complete" as const,
                        progress: 100,
                        message: "Model ready!",
                      },
                    })
                  }
                  return
                }

                if (!downloadProgressId) {
                  downloadProgressId = `download-${Date.now()}`
                }

                writer.write({
                  type: "data-modelDownloadProgress",
                  id: downloadProgressId,
                  data: {
                    status: "downloading" as const,
                    progress: percent,
                    message: `Downloading model... ${percent}%`,
                  },
                })
              },
            )
          }

          const result = streamText({
            model: this.model,
            messages: prompt,
            abortSignal,
          })

          writer.merge(result.toUIMessageStream({ sendStart: false }))
        } catch (err) {
          writer.write({
            type: "data-modelDownloadProgress",
            id: `error-${Date.now()}`,
            data: {
              status: "error" as const,
              progress: 0,
              message:
                err instanceof Error
                  ? err.message
                  : "Model failed to load. Try refreshing or switch to server mode.",
            },
          })
        }
      },
    })
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    return null
  }
}
