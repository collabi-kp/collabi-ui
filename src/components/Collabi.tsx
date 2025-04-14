import {JSX, useEffect, useRef, useState} from "react";
import collabi from "@/assets/collabi.png";
import angry from "@/assets/angry.png"
import {Avatar} from "antd";
import {useAngryCollabi} from "@/hooks/AngryCollabi.tsx";
import {useHappyCollabi} from "@/hooks/HappyCollabi.tsx";

interface CollabiMessage {
    type: string;
    message: string;
    timestamp: Date
}

interface CollabiProps {
    recording: boolean
    meetTitle: string
    meetMembers: string
    transcribe: any

}

export function Collabi({recording, meetMembers, meetTitle, transcribe}: CollabiProps): JSX.Element {
    const happyCollabi = useHappyCollabi(transcribe)
    const angryCollabi = useAngryCollabi(meetTitle, meetMembers, transcribe)
    const chatRef = useRef<HTMLDivElement>(null)
    const [collabiMessages, setCollabiMessages] = useState<CollabiMessage[]>([])
    const [intervalId, setIntervalId] = useState()


    useEffect(() => {
        if (chatRef.current)
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        const happyCollabis = happyCollabi.happyCollabiResponses.current.map(res=>({type:'happy', message:res.response, timestamp: res.timestamp}))
        const angryCollabis = angryCollabi.angryCollabiResponses.current.map(res=>({type: 'angry', message: res.text, timestamp: res.timestamp}))
        setCollabiMessages([...happyCollabis, ...angryCollabis])
    }, [angryCollabi.angryCollabiResponses.current, happyCollabi.happyCollabiResponses.current])


    useEffect(() => {
        if (!recording) {
            if (intervalId !== undefined) {
                clearInterval(intervalId)
                setIntervalId(undefined)
            }
            happyCollabi.getHappyCollabiResponse()
            angryCollabi.getAngryCollabiResponse()
            return
        }
        if(recording && intervalId === undefined) {
            happyCollabi.clearResponses()
            angryCollabi.clearResponses()
            const id = setInterval(() => {
                happyCollabi.getHappyCollabiResponse()
                angryCollabi.getAngryCollabiResponse()

            }, 30 * 1000)
            setIntervalId(id)
        }
    }, [recording]);

    return (
        <div style={{height: '100%', overflowY: 'auto', flexDirection: 'column-reverse'}} ref={chatRef}>
            {
                collabiMessages.sort((a,b)=>a.timestamp-b.timestamp).map((speak) => {
                    if (speak.type === 'happy')
                        return <HappyCollabiMessage msg={speak.message}/>
                    else
                        return <AngryCollabiMessage msg={speak.message}/>
                })
            }
        </div>
    )
}

function HappyCollabiMessage({msg}) {
    return (
        <div style={{display: "flex", width: 'calc(100% - 1rem)', margin: '0.5rem'}}>

            <Avatar size="large" icon={<img src={collabi}  alt="good"/>} style={{marginRight: '1.5rem', marginTop:'auto', marginBottom:'auto'}} />
            <div className="speech-bubble">
                <div style={{margin: '0.5rem'}} dangerouslySetInnerHTML={{__html:msg.replaceAll('\n','<br/>')}} />
            </div>
        </div>
    )
}

function AngryCollabiMessage({msg}) {
    return (
        <div style={{display: "flex", width: 'calc(100% - 1rem)', margin: '0.5rem'}}>
            <Avatar size="large" icon={<img src={angry}  alt="bad"/>} style={{marginRight: '1.5rem', marginTop:'auto', marginBottom:'auto'}} />
            <div className="bad-speech-bubble">
                <div style={{margin: '0.5rem'}} dangerouslySetInnerHTML={{__html:msg.replaceAll('\n','<br/>')}} />
            </div>
        </div>
    )
}