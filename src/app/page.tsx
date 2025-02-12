"use client"

import { useState } from "react"
import { Upload, Send } from "lucide-react"
import type React from "react"
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type Message = {
  text: string
  isUser: boolean
}

// Custom Button component
const Button = ({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) => (
  <button
    className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
    {...props}
  >
    {children}
  </button>
)

// Custom Input component
const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${className}`}
    {...props}
  />
)

// Custom Card components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white shadow-md rounded-lg ${className}`}>{children}</div>
)

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-5 border-b border-gray-200 sm:px-6">{children}</div>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-4 py-5 sm:p-6 ${className}`}>{children}</div>
)

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg leading-6 font-medium text-gray-900">{children}</h3>
)

export default function PdfChatPage() {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const [file, setFile] = useState<File | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
    }
  }

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, isUser: true }])
      setInput("")
      // Here you would typically send the message to your backend
      // and then add the response to the messages
      simulateResponse()
    }
  }

  const simulateResponse = () => {
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: "This is a simulated response. In a real application, this would be the AI's response based on the PDF content.",
          isUser: false,
        },
      ])
    }, 1000)
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <div className="w-full md:w-1/2 p-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-300 ease-in-out cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {file ? (
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-lg font-semibold text-gray-700">Drag and drop your PDF here</p>
                  <p className="text-sm text-gray-500 mt-2">or</p>
                  <label htmlFor="file-upload">
                    <Button className="mt-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
                      Select PDF
                    </Button>
                  </label>
                  <input id="file-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileInput} />
                </>
              )}
            </div>
            {file && (
              <Button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white">Upload and Process</Button>
            )}
          </CardContent>
          {file && (
             <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
             <Page pageNumber={pageNumber} />
           </Document>
          )}
         

        </Card>
      </div>
      <div className="w-full md:w-1/2 p-3">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Chat with PDF</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-auto">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.isUser ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <Button onClick={handleSend} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

