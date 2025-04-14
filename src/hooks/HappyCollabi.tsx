import axios from "axios";
import {useRef} from "react";

interface Request {
    meeting_text: string
    questions:string[]

}

interface Response {
    question: string,
    answer: string
    timestamp: number
}

export function useHappyCollabi(transcribe) {
    const apiGatewayId = import.meta.env.VITE_GATEWAY_ID
    const region =  import.meta.env.VITE_REGION
    const apiGatewayBaseUrl = `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/prod`


    const happyCollabiResponses = useRef<Array<Response>>([]);

    async function getHappyCollabiResponse(): Response {
        let questions = happyCollabiResponses.current?.map((response: Response) => response.question)
        // if (happyCollabiResponses.current.length !== 0) {
        //     let index = happyCollabiResponses.current.length - 1
        //     last_processed_qa = happyCollabiResponses.current[index].last_processed_qa
        // }


        const res = await axios.post(`${apiGatewayBaseUrl}/happy`,
            {
                meeting_text: transcribe.current.map(speak => `${speak.value}`).join('\n'),
                queestions: questions,
            }
        )

        const questFilter = ['식별된 질문이 없습니다. ', '처리할 새로운 질문이 없습니다.']
        if (questFilter.filter(quest => res.data.response.includes(quest)).length > 0) return
        const previousRequests = happyCollabiResponses.current.map(res => res.response)
        if (previousRequests.includes(res.data.response)) return
        happyCollabiResponses.current = [...happyCollabiResponses.current, res.data]
    }

    function clearResponses() {
        happyCollabiResponses.current = []
    }

    return {getHappyCollabiResponse, clearResponses, happyCollabiResponses}
}