import {JSX, useEffect, useRef, useState} from "react";
import collabi from "@/assets/collabi.png";
import angry from "@/assets/angry.png"
import {Avatar, Button, Card, Modal} from "antd";
import {useAngryCollabi} from "@/hooks/AngryCollabi.tsx";
import {useHappyCollabi} from "@/hooks/HappyCollabi.tsx";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
                <div dangerouslySetInnerHTML={{__html: `A: ${res.answer?.replaceAll('\n', '<br/>')}`}}/>
            </div>,
            timestamp: res.timestamp
        }))
        const angryCollabis = angryCollabi.angryCollabiResponses.current.map(res => ({
            type: 'angry',
            message: <div style={{width: '100%'}}>
                <div dangerouslySetInnerHTML={{__html: res.text?.replaceAll('\n', '<br/>')}}/>
                {[...new Set(res.citations)].map((citation) => <SummaryReferenceInfo
                    ref={citation.split('/').at(-1).replace('summary_', '').replace('.txt', '')}/>)}
            </div>,
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
            <div style={{height: 'calc(100% - 2rem)', overflowY: 'auto', flexDirection: 'column-reverse'}}
                 ref={chatRef}>
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

            <Avatar shape="circle" size={80} icon={<img src={collabi} alt="good"/>}
                    style={{marginRight: '1.5rem', marginTop: 'auto', marginBottom: 'auto', minWidth: '80px'}}/>
            <div className="speech-bubble" style={{padding: '1rem'}}>
                {msg}
            </div>
        </div>
    )
}

function AngryCollabiMessage({msg}) {
    return (
        <div style={{display: "flex", width: 'calc(100% - 1rem)', margin: '0.5rem'}}>
            <Avatar shape="circle" size={80} icon={<img src={angry} style={{minWidth: '100px'}} alt="bad"/>}
                    style={{marginRight: '1.5rem', marginTop: 'auto', marginBottom: 'auto', minWidth: '80px'}}/>
            <div className="bad-speech-bubble" style={{width: 'calc(100% - 100px - 1rem)', padding: '1rem'}}>
                {msg}
            </div>
        </div>
    )
}

function SummaryReferenceInfo({ref}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const apiGatewayId = import.meta.env.VITE_GATEWAY_ID
    const region = import.meta.env.VITE_REGION
    const apiGatewayBaseUrl = `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/prod`
    const [result, setResult] = useState()
    const [fetching, setFetching] = useState(false)

    const showModal = () => {
        getRef()
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };


    const getRef = async () => {
        setFetching(true)
        const res = await axios.get(`${apiGatewayBaseUrl}/summary`,
            {
                params: {
                    audio_id: ref,
                    summary_language: "ko",
                    translation_language: "ko"
                }
            })
        setResult(res.data.summary)
        setFetching(false)
    }
    return <>
        <Button className="ref-button" type="text" onClick={showModal}
                style={{color: 'blue', width: '100%', fontSize: '0.7rem', height: '1rem', textAlign: 'left'}}>
            {ref}
        </Button>
        <Modal
            okButtonProps={{style: {display: 'none'}}}
            cancelButtonProps={{style: {display: 'none'}}}
            width="80vh"
            height="80vh"
            loading={fetching} title={ref} open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
            <div className={"summary"} style={{height: 'calc(100% - 2.5rem)', overflowY: 'auto'}}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
        </Modal>
    </>
}