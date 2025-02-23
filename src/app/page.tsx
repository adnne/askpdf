"use client";

import { Worker } from "@react-pdf-viewer/core";
import { Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useState } from "react";
import { Upload, Send } from "lucide-react";
import type React from "react";

type Message = {
  text: string;
  isUser: boolean;
};

// Custom Button component
const Button = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) => (
  <button
    className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Custom Input component
const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${className}`}
    {...props}
  />
);

// Custom Card components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white shadow-md rounded-lg ${className}`}>{children}</div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-5 border-b border-gray-200 sm:px-6">{children}</div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-4 py-5 sm:p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg leading-6 font-medium text-gray-900">{children}</h3>
);

export default function PdfChatPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setFileUrl(URL.createObjectURL(droppedFile)); // Convert file to URL
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile)); // Convert file to URL
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, isUser: true }]);
      setInput("");
      simulateResponse();
    }
  };

  const simulateResponse = () => {
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: "This is a simulated response. In a real application, this would be the AI's response based on the PDF content.",
          isUser: false,
        },
      ]);
    }, 1000);
  };

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
      <div className="flex flex-col md:flex-row h-screen bg-gray-100">
        {/* PDF Upload and Viewer Section */}
        <div className="w-full md:w-1/2 p-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
            </CardHeader>
            <CardContent>
              {fileUrl ? (
                <div className="h-[calc(100vh-8rem)] relative">
                  <div onClick={() => setFileUrl(null)} className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded cursor-pointer z-50" >
                    remove
                  </div>
                  <Viewer fileUrl={fileUrl} />
                </div>
              ) : (
                <>
                  <div
                    className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-300 ease-in-out cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-lg font-semibold text-gray-700">Drag and drop your PDF here</p>
                    <p className="text-sm text-gray-500 mt-2">or</p>
                    <label htmlFor="file-upload">
                      <Button className="mt-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">Select PDF</Button>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileInput}
                    />
                  </div>
                  <Button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white">Upload and Process</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Section */}
        <div className="w-full md:w-1/2 p-3">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Chat with PDF</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${message.isUser ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-800"}`}>{message.text}</div>
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
                <Button
                  onClick={handleSend}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Worker>
  );
}