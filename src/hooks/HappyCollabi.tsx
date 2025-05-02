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
        const res = await axios.post(`${apiGatewayBaseUrl}/happy`,
            {
                meeting_text: transcribe.current.map(speak => `${speak.value}`).join('\n').slice(-400),
                queestions: questions,
            }
        )
        console.log(res.data)
        // const questionBlack = ["","없음","질문을 처리할 수 없습니다."]
        // if(questionBlack.includes(res.data.question) ) return
        happyCollabiResponses.current = [...happyCollabiResponses.current, ...res.data.questions]
    }

    function clearResponses() {
        happyCollabiResponses.current = []
    }

    return {getHappyCollabiResponse, clearResponses, happyCollabiResponses}
}