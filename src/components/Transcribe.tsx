import {RefObject, useEffect, useRef} from "react";
import {TranscribeResult} from "@/hooks/Transcribe.tsx";
import {type_of_audio} from "@/hooks/Summarize.tsx";

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
        <div style={{height: '100%', overflowY: 'auto', flexDirection: 'column-reverse'}} ref={chatRef}>
            {
                transcribe.current.map((speak) => {
                    return (
                        <div style={{display: "flex", justifyContent: "start"}}>
                            {mode !== type_of_audio.MONOLOGUE && <strong style={{whiteSpace: 'nowrap'}}>{speak.speaker} :</strong>}
                            <div>{speak.value}</div>
                        </div>
                    )
                })

            }
            <div style={{color: 'gray'}}>{currentTranscribe} </div>
        </div>
    )
}