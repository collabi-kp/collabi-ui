import {JSX, useEffect, useRef, useState} from "react";
import collabi from "@/assets/collabi.png";
import angry from "@/assets/angry.png"
import {Avatar, Card} from "antd";
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
    summarizeData: string
}

export function Collabi({recording, meetMembers, meetTitle, transcribe, summarizeData}: CollabiProps): JSX.Element {
    const happyCollabi = useHappyCollabi(transcribe)
    const angryCollabi = useAngryCollabi(meetTitle, meetMembers, transcribe, summarizeData)
    const chatRef = useRef<HTMLDivElement>(null)
    const [collabiMessages, setCollabiMessages] = useState<CollabiMessage[]>([])
    const [happyCollabiIntervalId, setHappyCollabiIntervalId] = useState(undefined)
    const [angryCollabiIntervalId, setAngryCollabiIntervalId] = useState(undefined)


    useEffect(() => {
        if (chatRef.current)
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        const happyCollabiBlack = ['정보없음']
        const happyCollabis = happyCollabi.happyCollabiResponses.current.filter(res => !happyCollabiBlack.includes(res.answer)).map(res => ({
            type: 'happy',
            message: <div>
                <b>Q: {res.question}</b>
                <div>A: {res.answer}</div>
            </div>,
            timestamp: res.timestamp
        }))
        const angryCollabis = angryCollabi.angryCollabiResponses.current.map(res => ({
            type: 'angry',
            message: res.text,
            timestamp: res.timestamp
        }))
        setCollabiMessages([...happyCollabis, ...angryCollabis])
    }, [angryCollabi.angryCollabiResponses.current, happyCollabi.happyCollabiResponses.current])


    useEffect(() => {
        if (!recording) {
            if (happyCollabiIntervalId !== undefined || angryCollabiIntervalId !== undefined) {
                clearInterval(happyCollabiIntervalId)
                clearInterval(angryCollabiIntervalId)
                setHappyCollabiIntervalId(undefined)
                setAngryCollabiIntervalId(undefined)
            }
            happyCollabi.getHappyCollabiResponse()
            angryCollabi.getAngryCollabiResponse()
            return
        }
        if (recording && happyCollabiIntervalId === undefined && angryCollabiIntervalId === undefined) {
            happyCollabi.clearResponses()
            angryCollabi.clearResponses()
            const happyIntervalId = setInterval(() => {
                happyCollabi.getHappyCollabiResponse()
            }, 20 * 1000)
            setHappyCollabiIntervalId(happyIntervalId)
            const angryIntervalId = setInterval(() => {
                angryCollabi.getAngryCollabiResponse()

            }, 3 * 60 * 1000)
            setAngryCollabiIntervalId(angryIntervalId)
        }
    }, [recording]);

    return (
        <Card
            title={"Hi Collabi"}
            style={{width: 'calc(100% - 1rem)', height: 'calc(100% - 1rem)', margin: '0.5rem'}}
            bodyStyle={{height: '100%'}}
        >
            <div style={{height: '100%', overflowY: 'auto', flexDirection: 'column-reverse'}} ref={chatRef}>
                {
                    collabiMessages.sort((a, b) => a.timestamp - b.timestamp).map((speak) => {
                        if (speak.type === 'happy')
                            return <HappyCollabiMessage msg={speak.message}/>
                        else
                            return <AngryCollabiMessage msg={speak.message}/>
                    })
                }
            </div>
        </Card>
    )
}

function HappyCollabiMessage({msg}) {
    return (
        <div style={{display: "flex", width: 'calc(100% - 1rem)', margin: '0.5rem', padding: '0.5rem'}}>

            <Avatar size="large" icon={<img src={collabi} alt="good"/>}
                    style={{marginRight: '1.5rem', marginTop: 'auto', marginBottom: 'auto'}}/>
            <div className="speech-bubble" style={{padding:'1rem'}}>
                {msg}
            </div>
        </div>
    )
}

function AngryCollabiMessage({msg}) {
    return (
        <div style={{display: "flex", width: 'calc(100% - 1rem)', margin: '0.5rem'}}>
            <Avatar size="large" icon={<img src={angry} alt="bad"/>}
                    style={{marginRight: '1.5rem', marginTop: 'auto', marginBottom: 'auto'}}/>
            <div className="bad-speech-bubble" style={{padding:'1rem'}}>
                <div style={{margin: '0.5rem'}} dangerouslySetInnerHTML={{__html: msg.replaceAll('\n', '<br/>')}}/>
            </div>
        </div>
    )
}