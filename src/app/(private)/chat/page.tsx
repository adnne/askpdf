"use client";

import { Worker } from "@react-pdf-viewer/core";
import { Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useEffect, useState } from "react";
import { Upload, Send } from "lucide-react";
import type React from "react";
import { createClient } from "../../../../utils/supabase/client";

type Message = {
  text: string;
  isUser: boolean;
};


export default function Chat() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setFileUrl(URL.createObjectURL(droppedFile)); 
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile)); 
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, isUser: true }]);
      setInput("");
      simulateResponse();
    }
  };
  const handleSelectPdf = () => {
    const fileInput = document.getElementById("file-upload");
    if (fileInput) {
      fileInput.click();
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
      ]);
    }, 1000);
  };

  const handleUpload = async () => {
    const supabase = createClient();
    if (!file) return;
    
    const file_path = `pdfs/${file.name}`;
  
    setUploading(true);

    const { data, error } = await supabase.storage
      .from('pdfs')
      .upload(file_path, file);

    if (error) {
      console.error('Error uploading file:', error);
    } else {
      console.log('File uploaded successfully:', data);
      const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: file_path,
        status: 'processing'
      })
      .select()
      .single()
    }

    setUploading(false);
  };

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
      <div className="flex flex-col md:flex-row h-screen bg-gray-100">
        {/* PDF Upload and Viewer Section */}
        <div className="w-full md:w-1/2 p-3">
          <div className="h-full bg-white shadow-md rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Upload PDF</h3>
            </div>
            <div className="px-4 py-5 sm:p-6 h-[calc(100vh-8rem)]">
              {fileUrl ? (
                <div className=" h-full relative">
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
                      <button onClick={handleSelectPdf} className="mt-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2">
                        Select PDF
                      </button>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileInput}
                    />
                  </div>
                
                </>
              )}
                <button onClick={handleUpload} className=" w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ">
                    Upload and Process
                </button>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full md:w-1/2 p-3">
          <div className="h-full flex flex-col bg-white shadow-md rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Chat with PDF</h3>
            </div>
            <div className="px-4 py-5 sm:p-6 flex-grow overflow-auto ">
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
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Worker>
  );
}