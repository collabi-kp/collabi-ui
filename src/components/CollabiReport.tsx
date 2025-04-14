import ReactMarkdown from 'react-markdown';
import {JSX, RefObject, useEffect, useState} from "react";
import {useSummarize} from "@/hooks/Summarize.tsx";
import {TranscribeResult} from "@/hooks/Transcribe.tsx";
import loading from "@/assets/loading.png";
import {Card, Divider, Progress, Spin} from "antd";
import {format} from 'date-fns';
import {ko} from 'date-fns/locale'
import remarkGfm from 'remark-gfm'


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
                backgroundColor: '#bcd1ad'
            }}>
                <div style={{textAlign: "center"}}>
                    <img src={loading} alt={"collabi"} style={{display: null}}/>
                </div>
            </div>
        )

    return (
        <Card
            style={{width:'calc(100% - 1rem)', height:'calc(100% - 1rem)', margin: '0.5rem'}}
            bodyStyle={{height: '100%'}}
            title={<div style={{display: 'flex', justifyContent: 'space-between', margin: '0.25rem'}}
            >
            {recording ?
                <div style={{marginTop:'0.25rem'}}>
                    {fetching ?
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <Spin/>
                            <div>ㅤ내용을 요약중입니다.</div>
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
        </div>}>
            <div  className={"summary"} style={{height:'calc(100% - 2.5rem)', overflowY: 'auto'}}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summarize.summary}</ReactMarkdown>
            </div>
        </Card>
    )
}