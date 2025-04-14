import './App.css'
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable.tsx";
import {Navigation} from '@/components/Navigation.tsx';
import {Collabi} from "@/components/Collabi.tsx";
import {Transcribe} from "@/components/Transcribe.tsx";
import {CollabiReport} from "@/components/CollabiReport.tsx";
import {useTranscribe} from "@/hooks/Transcribe.tsx";
import {useRef, useState} from "react";
import {type_of_audio} from "@/hooks/Summarize.tsx";

function App() {
    const [mode, setMode] = useState(type_of_audio.AUTO)
    const [meetTitle, setMeetTitle] = useState('')
    const [meetMembers, setMeetMembers] = useState('')
    const [finalSummarize, setFinalSummarize] = useState(false)
    const summarizeData = useRef<string>('')
    const transcribe = useTranscribe(meetTitle, meetMembers)

    return (
        <div style={{width: '100vw', height: '100vh', margin: 0, padding: 0}}>
            <Navigation
                recording={transcribe.recording}
                startRecording={transcribe.startRecording}
                stopRecording={transcribe.stopRecording}
                recordStartTime={transcribe.recordStartTime}
                mode={mode}
                setMode={setMode}
                meetTitle={meetTitle}
                setMeetTitle={setMeetTitle}
                meetMembers={meetMembers}
                setMeetMembers={setMeetMembers}
                finalSummarize={finalSummarize}
            />
            <ResizablePanelGroup
                style={{height: 'calc(100% - 5rem)', minWidth: '100vw'}}
                direction="horizontal"
                className="max-w-md rounded-lg border md:min-w-[450px]"
            >
                <ResizablePanel defaultSize={50}>
                    <CollabiReport audioId={transcribe.audioId} recording={transcribe.recording}
                                   transcribe={transcribe.transcribe} mode={mode} finalSummarize={finalSummarize}
                                   setFinalSummarize={setFinalSummarize} summarizeData={summarizeData} />
                </ResizablePanel>
                <ResizableHandle/>
                <ResizablePanel defaultSize={30}>
                    <Collabi recording={transcribe.recording} transcribe={transcribe.transcribe} meetTitle={meetTitle}
                             meetMembers={meetMembers} summarizeData={summarizeData}
                    />
                </ResizablePanel>
                <ResizableHandle/>
                <ResizablePanel defaultSize={20}>
                    <Transcribe mode={mode} transcribe={transcribe.transcribe}
                                currentTranscribe={transcribe.currentTranscribe}/>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}

export default App
