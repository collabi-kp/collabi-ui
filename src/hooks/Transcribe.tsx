import {useEffect, useRef, useState} from "react";
import mic from "microphone-stream";
import {TranscribeStreamingClient, StartStreamTranscriptionCommand, TranscribeStreamingClientConfig} from "@aws-sdk/client-transcribe-streaming";
import {Buffer} from "buffer/"; // ES Modules import
import process from 'process';

// @ts-ignore
window.Buffer = Buffer;
if (!('process' in window)) {
    // @ts-ignore
    window.process = process
}

export interface TranscribeResult{
    speaker: string
    value: string
}

export function useTranscribe(meetTitle, meetMembers) {
    const [recordStartTime, setRecordStartTime] = useState(undefined)
    const [recording, setRecording] = useState(false)
    const [config, setConfig] = useState<TranscribeStreamingClientConfig>()
    const transcribe = useRef<Array<TranscribeResult>>([]);
    const [currentTranscribe, setCurrentTranscribe] = useState("")

    const [numSpeakers, setNumSpeakers] = useState(0)

    const [recorder, setRecorder] = useState<MediaRecorder>(undefined)
    const [micStream, setMicStream] = useState<mic>()
    const [audioId, setAudioId] = useState(undefined)
    const [mediaStream, setMediaStream] = useState(undefined)

    const previousSpeaker = useRef<string>(undefined);

    useEffect(() => {
        setConfig({
            region: import.meta.env.VITE_REGION,
            credentials: {
                accessKeyId:import.meta.env.VITE_ACCESS_KEY,
                secretAccessKey:import.meta.env.VITE_SECRET_ACCESS_KEY,
            }
        })
    }, [])

    async function startRecording() {
        console.log('recording start')
        if(meetTitle === '' || meetMembers === '') {
            alert('회의 제목과 참여팀원값은 필수입니다.')
            return
        }
        setRecording(true)
        transcribe.current = []
        setRecordStartTime(new Date())
        setAudioId(`${meetTitle}_${meetMembers}_${new Date().toISOString()}`)
        const stream = await openRecordStream()
        startTranscription(stream)
    }

    async function openRecordStream() {
        const mediaMic = await navigator.mediaDevices.getUserMedia({audio: true})
        setMediaStream(mediaMic)
        // Join the two audio stream sources
        const audioContext = new AudioContext();

        const audioIn = audioContext.createMediaStreamSource(mediaMic)
        const dest = audioContext.createMediaStreamDestination();
        audioIn.connect(dest);
        const finalStream = dest.stream

        // Start recording.
        let newRecorder = new MediaRecorder(finalStream, {mimeType: 'video/webm'})

        // recorder.ondataavailable = (event) => data.push(event.data);
        newRecorder.onstop = () => {
            mediaMic.getTracks().forEach((t) => t.stop());
        };

        // timeslice: number of milliseconds to record into each Blob
        newRecorder.start();
        setRecorder(newRecorder)
        return finalStream
    }

    async function startTranscription(stream: MediaStream) {
        const newMicStream = new mic()
        newMicStream.setStream(stream);
        const transcribeClient = new TranscribeStreamingClient(config);
        startStreaming(transcribeClient, newMicStream)
        setMicStream(newMicStream)

    }

    const getAudioStream = async function* (micStream: mic) {
        for await (const chunk of micStream) {
            if (chunk.length <= 44100) {
                // chuck length 4096
                yield {
                    AudioEvent: {
                        AudioChunk: encodePCMChunk(chunk),
                    },
                };
            }
        }
    };

    async function startStreaming(transcribeClient, micStream: mic) {
        const command = new StartStreamTranscriptionCommand({
            // if identifyLanguage is true then use it, otherwise use language as LanguageCode
            ...
                {LanguageCode: 'ko-KR'},
            MediaEncoding: "pcm",
            MediaSampleRateHertz: 44100,
            AudioStream: getAudioStream(micStream),
            ShowSpeakerLabel: true,
            VocabularyFilterMethod: "mask",
            VocabularyName: 'collabi-voca',
            VocabularyFilterName: 'collabi-filter'

        });
        const data = await transcribeClient.send(command);
        for await (const event of data.TranscriptResultStream) {
            const results = event.TranscriptEvent.Transcript.Results;
            if (results.length) {
                const newTranscript = results[0].Alternatives[0].Transcript;
                const final = !results[0]?.IsPartial;
                const speaker = results[0].Alternatives[0]?.Items[0]?.Speaker;
                if (final) updateTranscription(newTranscript, speaker);
                else setCurrentTranscribe(speaker ? `Speaker ${speaker}: ${newTranscript}` : newTranscript);
                // callback(newTranscript + " ", final, speaker, identifiedLanguage);
            }
        }
    }

    function updateTranscription(transcription, speaker) {
        // when transcription is final, add the "speaker" label
        // transcription_array is the array of transcription sentences
        const transcription_array = transcribe.current
        let transcribeResult:TranscribeResult = {}
        if (!previousSpeaker.current || speaker !== previousSpeaker.current) {
            // when a sentence belongs to a new speaker, add the "speaker" label
            transcribeResult = {speaker: speaker ? `Speaker ${speaker}` : 'Unknown speaker', value:transcription}
            // text = `${speaker ? `Speaker ${speaker}` : 'Unknown speaker'}: ${transcription}`
            previousSpeaker.current = speaker
            setNumSpeakers(numSpeakers + 1)
        } else {
            // when a sentence belongs to the same speaker, append to the same sentence
            transcribeResult = transcription_array?.pop() ?? {}
            transcribeResult.value += transcription
        }
        // push the new final transcription with the speaker label to the array and store it in the transcription state variable
        transcription_array.push(transcribeResult)
        transcribe.current = transcription_array
        setCurrentTranscribe("")
    }

    const encodePCMChunk = (chunk) => {
        const input = mic.toRaw(chunk);
        let offset = 0;
        const buffer = new ArrayBuffer(input.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < input.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, input[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
        return Buffer.from(buffer);
    };

    function stopRecording() {
        recorder.stop();

        // send last chunk of conversation to summarize
        // summarizeTextAtInterval({getCurrentTranscription, setSummaryError})

        // close mic when finish transcription
        stopStreamingTranscription()

        // Stopping the tracks makes sure the recording icon in the tab is removed.
        recorder.stream.getTracks().forEach((t) => t.stop());

        // Clear state ready for next recording
        setRecorder(undefined)

        // Update current state in URL
        window.location.hash = '';

        setRecording(false)
    }


    const stopStreamingTranscription = () => {
        if (micStream) {
            micStream.stop();
            micStream.destroy();
            setMicStream(undefined);
            setMediaStream(undefined);
        }
        setRecordStartTime(undefined)
    };
    return {recording, startRecording, stopRecording, transcribe, currentTranscribe, audioId, recordStartTime, mediaStream}
}