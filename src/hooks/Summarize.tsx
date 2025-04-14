import {useState} from "react";
import axios from 'axios';

export const type_of_audio = {
    AUTO: 'auto',
    MONOLOGUE: 'monologue',
    DIALOGUE: 'dialogue'
}

export const useSummarize = (audioId: string, mode: any) => {
    const apiGatewayId = import.meta.env.VITE_GATEWAY_ID
    const region =  import.meta.env.VITE_REGION
    const apiGatewayBaseUrl = `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/prod`
    const [summary, setSummary] = useState(undefined)
    const [summaryError, setSummaryError] = useState()

    function convertTranscribe(transcription) {
        if (mode !== type_of_audio.MONOLOGUE)
            return transcription.current.map(speak => `${speak.value}`).join('\n')
        else
            return transcription.current.map(speak => `${speak.speaker}: ${speak.value}`).join('\n')
    }

    async function retriveSummary(transcription: string) {
        await summarizeTextAtInterval(transcription, mode)
        if (audioId === undefined) return
        getSummary(audioId)
            .then(value => {
                if (value?.error) {
                    setSummary("")
                    if (!summaryError) {
                        setSummaryError(value.message)
                    }
                } else {
                    setSummary(value)
                }
            })
            .catch(error => console.log(error))
    }

    async function summarizeTextAtInterval(transcription, mode) {
        // send conversation to Amazon Bedrock through API GW to generate a summary

        setSummaryError(null)
        // const audioType = numSpeakers > 1 ? type_of_audio.DIALOGUE : type_of_audio.MONOLOGUE
        if (transcription.current === undefined) return
        await sendText(audioId, convertTranscribe(transcription), mode)
            .then(value => {
                if (value?.error) setSummaryError(value.message)
            })
            .catch(error => console.log(error))
    }


    const sendText = async (audioId, transcription, audioType) => {

        try {

            console.log("About to send transcription to API gateway - START", {audioId})
            console.log(transcription)
            const res = await axios.post(`${apiGatewayBaseUrl}/summarization`,
                {
                    audio_id: audioId,
                    original_language: 'ko-KR',
                    translation_language: 'ko',
                    original_text: transcription,
                    translated_text: transcription,
                    type_of_audio: audioType
                }
            )

            console.log("Response status code:", res.status)

            console.log("response")
            console.log(res.data)

            return res.data?.summary_language

        } catch (err) {
            console.log("Transcription to API gateway - FAILURE")

            console.log(err)

            const message = "Error: Cannot summarize the transcript."

            return {error: true, message}
        }

    }

    const getSummary = async () => {

        try {

            console.log("About to get summary from API gateway - START", {audioId})

            const res = await axios.get(`${apiGatewayBaseUrl}/summary`,
                {
                    params: {
                        audio_id: audioId,
                        summary_language: "ko",
                        translation_language: "ko"
                    }
                })

            console.log("Response status code:", res.status)

            console.log("response")
            console.log(res.data)

            return res.data?.summary

        } catch (err) {
            console.log("Summary from API gateway - FAILURE")
            console.log(err)

            const message = `Summary not supported for this language pair.`
            return {error: true, message}
        }
    }

    function clearSummarize() {
        setSummary(undefined)
    }

    return {summary, retriveSummary, clearSummarize}
}