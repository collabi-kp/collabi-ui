import ReactMarkdown from 'react-markdown';
import {JSX, RefObject, useEffect, useState} from "react";
import {useSummarize} from "@/hooks/Summarize.tsx";
import {TranscribeResult} from "@/hooks/Transcribe.tsx";
import collabi from "@/assets/collabi.png";
import {Divider, Progress, Spin} from "antd";
import {format} from 'date-fns';
import {ko} from 'date-fns/locale'


interface CollabiReportProps {
    audioId: string,
    recording: boolean
    transcribe: RefObject<Array<TranscribeResult>>
    mode: string
    finalSummarize: boolean
    setFinalSummarize: (value: boolean) => void
    summarizeData: RefObject<string>
}

export function CollabiReport({audioId, recording, transcribe, mode, finalSummarize, setFinalSummarize, summarizeData}: CollabiReportProps): JSX.Element {
    const summarize = useSummarize(audioId,mode)
    const [intervalId, setIntervalId] = useState()
    const [fetching, setFetching] = useState(false)
    const [summaryTime, setSummaryTime] = useState(new Date())
    const [duration, setDuration] = useState()


    useEffect(() => {
        if (!recording) {
            setFinalSummarize(true)
            if (intervalId !== undefined) {
                clearInterval(intervalId)
                setIntervalId(undefined)
            }
            summarize.retriveSummary(transcribe)
                .then(()=> {
                    setFetching(false)
                    setFinalSummarize(false)
                })
            return
        }
        if(recording && intervalId === undefined) {
            summarize.clearSummarize()
            const id = setInterval(() => {
                setFetching(true)
                setSummaryTime(new Date())
                summarize.retriveSummary(transcribe)
                    .then(() => setFetching(false))


            }, 30 * 1000)
            setIntervalId(id)
        }
    }, [recording]);

    useEffect(() => {
        if (summaryTime === undefined) return
        setTimeout(() => calcDuration(summaryTime), 1000)
    }, [duration, summaryTime]);

    const calcDuration = (startTime: Date) => {
        const duration = new Date().valueOf() - new Date(startTime).valueOf()
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);
        setDuration(seconds)
    }

    useEffect(() => {
        summarizeData.current = summarize.summary
    }, [summarize.summary]);

    if (summarize.summary === undefined)
        return (
            <div style={{
                display: 'flex',
                height: '100%',
                alignItems: "center",
                justifyContent: 'center',
                backgroundColor: 'darkseagreen'
            }}>
                <div style={{textAlign: "center"}}>
                    <img src={collabi} alt={"collabi"} style={{display: null}}/>
                    <div style={{fontSize: '40px', fontFamily: "Nanum Pen Script", fontWeight: '400'}}>콜라비가 회의를
                        준비중입니다.
                    </div>
                </div>
            </div>
        )

    return (
        <>
            <div style={{display: 'flex', justifyContent: 'space-between', margin: '0.25rem'}}>
                {recording ?
                    <div style={{marginTop:'0.25rem'}}>
                        {fetching ?
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                <div>내용을 요약중입니다.</div>
                                <Spin/>
                            </div>
                            :
                            <Progress percent={duration/30 * 100} format={()=><></>} percentPosition={{align: 'center', type: 'inner'}} size={[400, 20]} />
                        }
                    </div>
                    :<div></div>
                }
                <div style={{marginTop:'0.25rem'}}>
                    요약 기준 일시 : {format(summaryTime, 'yyyy-MM-dd HH시 mm분', {locale: ko})}
                </div>
            </div>
            <Divider style={{margin: '0.25rem'}}/>
            <div style={{height:'calc(100% - 3rem)', overflowY: 'auto'}}>
                <ReactMarkdown >{summarize.summary}</ReactMarkdown>
            </div>
        </>
    )
}