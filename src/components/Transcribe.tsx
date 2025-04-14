import {RefObject, useEffect, useRef} from "react";
import {TranscribeResult} from "@/hooks/Transcribe.tsx";
import {type_of_audio} from "@/hooks/Summarize.tsx";
import {Card} from "antd";

interface TranscribeProps {
    mode: string
    transcribe: RefObject<Array<TranscribeResult>>,
    currentTranscribe: string,
}

export function Transcribe({mode, transcribe, currentTranscribe}: TranscribeProps) {
    const chatRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (chatRef.current)
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [currentTranscribe])

    return (
        <Card
            title={"실시간 대화내용"}
            style={{width: 'calc(100% - 1rem)', height: 'calc(100% - 1rem)', margin: '0.5rem'}}
            bodyStyle={{height: '100%'}}
        >
            <div style={{height: 'calc(100% - 2rem)', overflowY: 'auto', flexDirection: 'column-reverse'}} ref={chatRef}>
                {
                    transcribe.current.map((speak) => {
                        return (
                            <div style={{display: "flex", justifyContent: "start"}}>
                                {mode !== type_of_audio.MONOLOGUE &&
                                    <strong style={{whiteSpace: 'nowrap'}}>{speak.speaker} :</strong>}
                                <div>{speak.value}</div>
                            </div>
                        )
                    })

                }
                <div style={{color: 'gray'}}>{currentTranscribe} </div>
            </div>
        </Card>
    )
}