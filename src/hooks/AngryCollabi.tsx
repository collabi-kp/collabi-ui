import axios from "axios";
import {useRef} from "react";

interface Request {
    department: string
    subject: string
    text: string
    previous:string[],
    // last_conversation: string
}

interface Response {
    text: string
    timestamp: number,
    citations: Array<string>,
}

// 30초 단위 call
export function useAngryCollabi(meetTitle, meetMembers,transcribe,summarizeData) {
    const apiGatewayId = import.meta.env.VITE_GATEWAY_ID
    const region =  import.meta.env.VITE_REGION
    const apiGatewayBaseUrl = `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/prod`

    const angryCollabiResponses = useRef<Array<Response>>([]);
    async function getAngryCollabiResponse(): Response{
        if(summarizeData.current === '' || summarizeData.current === undefined) return
        const res = await axios.post(`${apiGatewayBaseUrl}/history`,
            {
                department: meetMembers,
                subject: meetTitle,
                text: summarizeData.current,//transcribe.current.map(speak => `${speak.value}`).join('\n'),
                // previous: angryCollabiResponses.current.map(res=>res.text)
            }
        )
        angryCollabiResponses.current =[...angryCollabiResponses.current, res.data]
    }

    function clearResponses(){
        angryCollabiResponses.current = []
    }

    return {getAngryCollabiResponse, clearResponses,angryCollabiResponses}

}