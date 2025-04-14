import logo from "@/assets/logo.png";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useEffect, useState} from "react";
import {Radio} from 'antd';
import {type_of_audio} from "@/hooks/Summarize.tsx";

interface NavigationProps {
    recording: boolean
    startRecording: Function
    stopRecording: Function
    recordStartTime: Date
    mode: any
    setMode: Function
    meetTitle: string
    setMeetTitle: Function
    meetMembers: string
    setMeetMembers: Function
    finalSummarize: boolean
}

export function Navigation({
                               recording,
                               startRecording,
                               stopRecording,
                               recordStartTime,
                               mode,
                               setMode, meetTitle,setMeetTitle,meetMembers,setMeetMembers, finalSummarize
                           }: NavigationProps) {
    const [duration, setDuration] = useState('')
    const modeOptions = [
        {label: '자동', value: type_of_audio.AUTO},
        {label: '회의', value: type_of_audio.DIALOGUE},
        {label: '강연', value: type_of_audio.MONOLOGUE},
    ]

    useEffect(() => {
        if (recordStartTime === undefined) return
        setTimeout(() => calcDuration(recordStartTime), 1000)
    }, [duration, recordStartTime]);

    const calcDuration = (startTime: Date) => {
        const duration = new Date().valueOf() - new Date(startTime).valueOf()
        const days = Math.floor(duration / (1000 * 60 * 60 * 24));
        const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);
        const milliseconds = Math.floor(duration % 10);
        setDuration(`${days === 0 ? '' : days + 'd'}${hours === 0 ? '' : hours + 'h'}${minutes === 0 ? '' : minutes + 'm'}${seconds === 0 ? '' : `${seconds}.${milliseconds}` + 's'}`)
    }

    return (
        <div style={{height: '5rem', width: '100vw', margin: 0, padding: 0}}>
            <div style={{display: "flex", justifyContent: 'space-between', width: '100%'}}>
                <img src={logo} alt={"0"} style={{height: '4rem', margin: ' auto 1rem'}}/>
                <div style={{display: "flex", justifyContent: 'space-between', width: '100%', margin: 'auto 1rem'}}>
                    <div style={{width: '100%', marginTop: '0.25rem'}}>
                        <div style={{display: "flex", justifyContent: 'space-between', width: '100%'}}>
                            <Label style={{width: '5rem'}}>회의제목</Label>
                            <Input disabled={recording} value={meetTitle} onChange={e=>setMeetTitle(e.target.value)}></Input>
                        </div>
                        <div style={{display: "flex", justifyContent: 'space-between', width: '100%'}}>
                            <Label style={{width: '5rem'}}>참여팀</Label>
                            <Input disabled={recording} value={meetMembers} onChange={e=>setMeetMembers(e.target.value)}></Input>
                        </div>
                    </div>
                    <div style={{display: "flex", justifyContent: 'end', width: '100%'}}>

                        <div>
                            {recording ?
                                <Button style={{height: '2rem', width:'16rem', margin:'0.25rem 0', backgroundColor:'#252422'}} onClick={() => stopRecording()}
                                        disabled={!recording}>
                                    🔴ㅤ회의중({duration}) (중지하기)
                                </Button>
                                : <Button style={{height: '2.5rem', width:'16rem', margin:'0.25rem 0', backgroundColor:'#252422'}} onClick={() => startRecording()}
                                        disabled={recording || finalSummarize}>
                                    {finalSummarize ?<>{"최종요약중"}</>: <>{"회의시작"}</>}
                                </Button>
                            }
                            <div style={{display: "flex", justifyContent: 'start', width: '100%'}}>
                                <Label style={{width: '4rem'}}>음성 모드</Label>
                                <Radio.Group
                                    disabled={recording}
                                    style={{width: '12rem', margin: 'auto 1px'}}
                                    value={mode}
                                    onChange={e => setMode(e.target.value)}
                                    block
                                    options={modeOptions}
                                    defaultValue={type_of_audio.AUTO}
                                    optionType="button"
                                    buttonStyle="solid"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}