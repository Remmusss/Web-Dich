'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { useTabState } from '@/hooks/useTabState'
import { translatorService } from '@/lib/translator-service'
import { TRANSLATION_TONES } from '@/lib/ai-service'
import { dictionaryService } from '@/lib/dictionary-service'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  ArrowsRightLeftIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  SpeakerWaveIcon,
  DocumentArrowUpIcon,
  ChevronDownIcon,
  SparklesIcon,
  StopIcon,
  PhotoIcon,
  DocumentTextIcon,
  DocumentIcon,
  ClipboardIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import { SUPPORTED_LANGUAGES } from '@/constants/languages'
import JSZip from 'jszip'
import { useDebounce } from '@/hooks/useDebounce'
import { Dialog, Transition } from '@headlessui/react'
import { FaSearch } from 'react-icons/fa'

export default function Translator() {
  const [mounted, setMounted] = useState(false)

  // Text tab state
  const [sourceText, setSourceText] = useState('')
  const [textTranslatedText, setTextTranslatedText] = useState('')
  const [textTranslated, setTextTranslated] = useState(false)

  // Shared state
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLanguage, setSourceLanguage] = useTabState('sourceLanguage', 'auto')
  const [targetLanguage, setTargetLanguage] = useTabState('targetLanguage', 'dđ')
  const [translationTone, setTranslationTone] = useTabState('translationTone', 'normal')
  const [customToneStyle, setCustomToneStyle] = useTabState('customToneStyle', '')
  const [customToneInstructions, setCustomToneInstructions] = useTabState('customToneInstructions', '')
  const [showCustomToneInputs, setShowCustomToneInputs] = useState(false)
  const [useMarkdown, setUseMarkdown] = useTabState('useMarkdown', false)
  const [useFormat, setUseFormat] = useTabState('useFormat', false)
  const [useMarkdownFormat, setUseMarkdownFormat] = useTabState('useMarkdownFormat', false)
  const [useMarkdownDisplay, setUseMarkdownDisplay] = useTabState('useMarkdownDisplay', false)
  const [isCustomToneModalOpen, setIsCustomToneModalOpen] = useState(false)
  const customToneStyleRef = useRef<HTMLTextAreaElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [contentHeight, setContentHeight] = useState<number>(500)
  const sourceTextRef = useRef<HTMLTextAreaElement>(null)
  const translatedTextRef = useRef<HTMLDivElement>(null)
  const [isSourcePlaying, setIsSourcePlaying] = useState(false)
  const [isTranslationPlaying, setIsTranslationPlaying] = useState(false)

  // Image tab state
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageTranslatedText, setImageTranslatedText] = useState<string>('')
  const [imageTranslated, setImageTranslated] = useState(false)

  // File tab state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [translatedFiles, setTranslatedFiles] = useState<{ name: string, content: string }[]>([])
  const [filesTranslated, setFilesTranslated] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'file'>('text')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [lastTypedTime, setLastTypedTime] = useState<number>(0)
  const [isPasteEnabled, setIsPasteEnabled] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Add effect for auto-translation when image is pasted
  useEffect(() => {
    if (activeTab === 'image' && selectedImage && !imageTranslated) {
      handleImageTranslation(useMarkdownFormat, useFormat);
    }
  }, [selectedImage, activeTab, imageTranslated]);

  // Add effect for auto-translation
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    
    const checkAndTranslate = () => {
      const now = Date.now();
      if (now - lastTypedTime >= 200 && sourceText.trim() && activeTab === 'text' && !textTranslated) {
        handleTranslation();
      }
    };

    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(checkAndTranslate, 200);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [lastTypedTime, sourceText, activeTab, textTranslated]);

  // Supported file types
  const SUPPORTED_FILE_TYPES = {
    'text/plain': '.txt',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/pdf': '.pdf',
    'text/markdown': '.md',
    'text/csv': '.csv',
    'application/json': '.json',
    'text/html': '.html',
    'application/xml': '.xml',
    'text/xml': '.xml',
    'application/rtf': '.rtf'
  };

  const isFileTypeSupported = (file: File) => {
    return Object.keys(SUPPORTED_FILE_TYPES).includes(file.type);
  };

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const updateHeight = () => {
      if (sourceTextRef.current && translatedTextRef.current) {
        const sourceHeight = sourceTextRef.current.scrollHeight
        const translatedHeight = translatedTextRef.current.scrollHeight
        const maxHeight = Math.max(sourceHeight, translatedHeight, 500) // Minimum 500px
        setContentHeight(maxHeight)
      }
    }

    // Update height whenever content changes
    updateHeight()

    // Add resize observer to handle dynamic content changes
    const resizeObserver = new ResizeObserver(updateHeight)
    if (sourceTextRef.current) resizeObserver.observe(sourceTextRef.current)
    if (translatedTextRef.current) resizeObserver.observe(translatedTextRef.current)

    return () => resizeObserver.disconnect()
  }, [sourceText, translatedText])

  // Add effect to handle paste events globally
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (activeTab !== 'image' || !isPasteEnabled) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault(); // Prevent default paste behavior
          const file = items[i].getAsFile();
          if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
              setError('Image size should be less than 10MB');
              return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setImageTranslated(false); // Reset when pasting a new image
            setError(null);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeTab, isPasteEnabled]);

  // Effect to handle language or tone changes and update the translation if needed
  useEffect(() => {
    // Reset translation flags when language or tone changes
    setTextTranslated(false);
    setImageTranslated(false);
    setFilesTranslated(false);

    // Only trigger retranslation if we have existing content
    if (!isLoading) {
      if (activeTab === 'text' && sourceText.trim()) {
        handleTranslation();
      } else if (activeTab === 'image' && selectedImage) {
        handleImageTranslation(useMarkdownFormat, useFormat);
      } else if (activeTab === 'file' && uploadedFiles.length > 0) {
        handleTranslation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLanguage, translationTone]);

  const handleTranslation = async () => {
    if (activeTab === 'file' && uploadedFiles.length === 0) return;
    if (activeTab === 'text' && !sourceText.trim()) return;
    if (activeTab === 'image' && !selectedImage) return;

    // Check if already translated for this tab
    if ((activeTab === 'text' && textTranslated) ||
      (activeTab === 'image' && imageTranslated) ||
      (activeTab === 'file' && filesTranslated)) {
      return;
    }

    // Don't show loading state for auto-translation
    if (sourceText === sourceText) {
      setIsLoading(true);
    }
    setError(null);

    try {
      if (activeTab === 'file') {
        const translatedContents = await translatorService.translateFiles(
          uploadedFiles,
          {
            targetLanguage,
            preserveContext: true,
            tone: translationTone,
            useFormat,
            useMarkdownFormat
          }
        );
        setTranslatedFiles(translatedContents);
        setFilesTranslated(true);
      } else if (activeTab === 'image') {
        await handleImageTranslation(useMarkdownFormat, useFormat);
      } else {
        const result = await translatorService.translateText(
          sourceText,
          {
            targetLanguage,
            preserveContext: true,
            tone: translationTone,
            useFormat,
            useMarkdownFormat
          }
        );
        setTextTranslatedText(result);
        setTranslatedText(result);
        setTextTranslated(true);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi dịch văn bản');
    } finally {
      if (sourceText === sourceText) {
        setIsLoading(false);
      }
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleTextPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSourceText(text);
      setTextTranslated(false); // Reset when pasting new text
      setLastTypedTime(Date.now()); // Update last typed time
    } catch (err) {
      console.error('Failed to paste text:', err);
    }
  };

  const handleImagePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // Validate file size (max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            setError('Image size should be less than 10MB');
            return;
          }
          setSelectedImage(file);
          setImagePreview(URL.createObjectURL(file));
          setImageTranslated(false); // Reset when pasting a new image
          setError(null);
          return;
        }
      }
    }
  };

  const handleDownload = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'translated.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const unsupportedFiles = files.filter(file => !isFileTypeSupported(file));
    if (unsupportedFiles.length > 0) {
      setError(`Unsupported file type(s). Supported formats: ${Object.values(SUPPORTED_FILE_TYPES).join(', ')}`);
      return;
    }

    setUploadedFiles(prev => [...prev, ...files]);
    setFilesTranslated(false); // Reset translated state when new files are uploaded
    setError(null);
  };

  const handleSpeech = (text: string, lang: string, isSource: boolean) => {
    const setPlaying = isSource ? setIsSourcePlaying : setIsTranslationPlaying
    const isPlaying = isSource ? isSourcePlaying : isTranslationPlaying

    if (isPlaying) {
      window.speechSynthesis.cancel()
      setPlaying(false)
    } else {
      const utterance = new SpeechSynthesisUtterance(text)

      // Xử lý ngôn ngữ nguồn
      if (lang === 'auto') {
        // Thử detect ngôn ngữ từ text hoặc fallback về en-US
        try {
          // Sử dụng 2 ký tự đầu tiên của đoạn text để detect ngôn ngữ
          const detectedLang = text.trim().length >= 2 ?
            (text.charCodeAt(0) > 127 || text.charCodeAt(1) > 127 ? 'vi-VN' : 'en-US')
            : 'en-US';
          utterance.lang = detectedLang;
        } catch (e) {
          utterance.lang = 'en-US';
        }
      } else {
        // Thêm region code cho một số ngôn ngữ phổ biến
        const langMap: { [key: string]: string } = {
          'en': 'en-US',
          'vi': 'vi-VN',
          'ja': 'ja-JP',
          'ko': 'ko-KR',
          'zh': 'zh-CN',
          // Thêm các ngôn ngữ khác nếu cần
        };
        utterance.lang = langMap[lang] || lang;
      }

      utterance.onend = () => setPlaying(false)
      window.speechSynthesis.speak(utterance)
      setPlaying(true)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setImageTranslated(false); // Reset translated state when a new image is uploaded
    setError(null);
  };

  const handleImageTranslation = async (useMarkdown: boolean, useFormat: boolean) => {
    if (!selectedImage) return;

    // If already translated, just update the display
    if (imageTranslated) {
      setTranslatedText(imageTranslatedText);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert image to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      // Remove data URL prefix
      const base64Content = base64Data.split(',')[1];

      const result = await translatorService.translateImage({
        imageData: base64Content,
        mimeType: selectedImage.type,
        targetLanguage,
        preserveContext: true,
        tone: translationTone,
        useFormat,
        useMarkdownFormat: useMarkdown
      });

      setImageTranslatedText(result);
      setTranslatedText(result);
      setImageTranslated(true);
      return result; // Return the result so it can be used by the caller
    } catch (error) {
      console.error('Image translation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to translate image');
      throw error; // Re-throw to be caught by the caller
    } finally {
      // Always reset loading state
      if (activeTab !== 'text' || sourceText === sourceText) {
        setIsLoading(false);
      }
    }
  };

  // Update tab switching handler to preserve data when switching tabs
  const handleTabSwitch = (tab: 'text' | 'image' | 'file') => {
    if (tab === activeTab) return; // Don't do anything if switching to the same tab

    setActiveTab(tab);
    // Enable paste for image tab
    setIsPasteEnabled(tab === 'image');

    // Clear any previous error
    setError(null);

    // Reset loading state
    setIsLoading(false);

    // Update the translated text display based on active tab
    // without triggering new translations
    if (tab === 'text') {
      setTranslatedText(textTranslatedText);
    } else if (tab === 'image') {
      setTranslatedText(imageTranslatedText);
    } else {
      // File tab has its own display logic
    }
  };

  // Update image container click handler
  const handleImageContainerClick = () => {
    if (activeTab === 'image' && !imagePreview) {
      fileInputRef.current?.click();
    }
  };

  const isTranslateButtonDisabled = () => {
    if (isLoading) return true;

    switch (activeTab) {
      case 'text':
        return !sourceText.trim();
      case 'image':
        return !selectedImage;
      case 'file':
        return uploadedFiles.length === 0;
      default:
        return true;
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging if we're dragging files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only unset dragging if we're leaving the drop zone
    // and not entering a child element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (activeTab === 'image') {
      const file = files[0];
      // Handle image file drop
      if (!file.type.startsWith('image/')) {
        setError('Please drop an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setImageTranslated(false); // Reset when a new image is dropped
    } else if (activeTab === 'file') {
      // Filter out unsupported files
      const supportedFiles = files.filter(file => isFileTypeSupported(file));
      const unsupportedFiles = files.filter(file => !isFileTypeSupported(file));

      if (unsupportedFiles.length > 0) {
        setError(`Some files are not supported. Supported formats: ${Object.values(SUPPORTED_FILE_TYPES).join(', ')}`);
      }

      if (supportedFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...supportedFiles]);
        setFilesTranslated(false); // Reset when new files are dropped
      }
    } else {
      // Handle text file drop for text tab
      const file = files[0];
      if (!file.type.startsWith('text/')) {
        setError('Please drop a text file');
        return;
      }

      try {
        const text = await file.text();
        setSourceText(text);
        setTextTranslated(false); // Reset when a new text file is dropped
      } catch (error) {
        console.error('Error reading file:', error);
        setError('Error reading file. Please try again.');
      }
    }
  };

  const handleDownloadTranslated = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (translatedFiles.length === 0) return;

    // Create a zip file if multiple files
    if (translatedFiles.length > 1) {
      const zip = new JSZip();
      translatedFiles.forEach(file => {
        zip.file(file.name, file.content);
      });
      zip.generateAsync({ type: "blob" }).then(content => {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'translated_files.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } else {
      // Download single file directly
      handleDownloadTranslated(translatedFiles[0].name, translatedFiles[0].content);
    }
  };

  const handleTextAreaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const text = e.target.value;
    setSourceText(text);
    setTextTranslated(false); // Reset translated flag when text changes
    setLastTypedTime(Date.now()); // Update last typed time

    if (!text.trim()) {
      // Reset height when no text
      textarea.style.height = '';
      setContentHeight(500); // Reset to default height
      return;
    }

    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = `${textarea.scrollHeight}px`; // Set new height
  };

  // Don't render content until mounted (client-side)
  if (!mounted) {
    return null
  }

  return (
    <div className="mx-auto px-2 py-8 max-w-7xl">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabSwitch('text')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'text'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <DocumentTextIcon className="h-5 w-5" />
            Text
          </button>
          <button
            onClick={() => handleTabSwitch('image')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'image'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <PhotoIcon className="h-5 w-5" />
            Image
          </button>
          <button
            onClick={() => handleTabSwitch('file')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'file'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <DocumentArrowUpIcon className="h-5 w-5" />
            File
          </button>
        </div>

        {/* Add file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept={activeTab === 'image' ? "image/*" : Object.keys(SUPPORTED_FILE_TYPES).join(',')}
          onChange={activeTab === 'image' ? handleImageUpload : handleFileUpload}
          className="hidden"
          multiple={activeTab === 'file'}
        />

        {/* Language Selection Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="relative group flex-1 sm:flex-none">
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base font-medium min-w-0 sm:min-w-[160px] cursor-pointer"
              >
                <option value="auto">Detect Language</option>
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-transparent hover:border-gray-200 shrink-0"
              onClick={() => {
                const temp = sourceLanguage
                setSourceLanguage(targetLanguage)
                setTargetLanguage(temp)
                const tempText = sourceText
                setSourceText(translatedText)
                setTranslatedText(tempText)
              }}
            >
              <ArrowsRightLeftIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
            </button>

            <div className="relative group flex-1 sm:flex-none">
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base font-medium min-w-0 sm:min-w-[160px] cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative group flex-1 sm:flex-none">
              <select
                value={translationTone}
                onChange={(e) => {
                  setTranslationTone(e.target.value)
                  if (e.target.value === 'custom') {
                    setIsCustomToneModalOpen(true)
                  }
                }}
                className="w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base font-medium min-w-0 sm:min-w-[160px] cursor-pointer"
              >
                {Object.entries(TRANSLATION_TONES).map(([key, tone]) => (
                  <option key={key} value={key} title={tone.description}>
                    {tone.name}
                  </option>
                ))}
              </select>
              {translationTone === 'custom' && (
                <button
                  onClick={() => setIsCustomToneModalOpen(true)}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                  title="Edit custom tone"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Custom Tone Modal */}
          <Transition appear show={isCustomToneModalOpen} as={Fragment}>
            <Dialog 
              as="div" 
              className="relative z-50"
              onClose={() => {
                // Only close if custom tone has content
                if (customToneStyle.trim() || translationTone !== 'custom') {
                  setIsCustomToneModalOpen(false)
                }
              }}
              initialFocus={customToneStyleRef}
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 mb-4"
                      >
                        Tùy chỉnh phong cách dịch
                      </Dialog.Title>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="customToneStyle" className="block text-sm font-medium text-gray-700 mb-2">
                            Phong cách dịch <span className="text-red-500">*</span>
                          </label>
                          <Textarea
                            ref={customToneStyleRef}
                            id="customToneStyle"
                            value={customToneStyle}
                            onChange={(e) => {
                              setCustomToneStyle(e.target.value)
                              TRANSLATION_TONES.custom.style = e.target.value
                            }}
                            placeholder="Ví dụ: Dịch theo phong cách trang trọng và chuyên nghiệp..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                            rows={3}
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="customToneInstructions" className="block text-sm font-medium text-gray-700 mb-2">
                            Hướng dẫn đặc biệt (tùy chọn)
                          </label>
                          <Textarea
                            id="customToneInstructions"
                            value={customToneInstructions}
                            onChange={(e) => {
                              setCustomToneInstructions(e.target.value)
                              TRANSLATION_TONES.custom.specialInstructions = e.target.value
                            }}
                            placeholder="Ví dụ:&#13;- Sử dụng từ vựng chuyên ngành&#13;- Giữ nguyên các thuật ngữ kỹ thuật&#13;- Thêm chú thích cho các từ khó"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                            rows={4}
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                          onClick={() => {
                            if (translationTone === 'custom' && !customToneStyle.trim()) {
                              setTranslationTone('normal')
                            }
                            setIsCustomToneModalOpen(false)
                          }}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-xl border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          onClick={() => {
                            if (!customToneStyle.trim()) {
                              customToneStyleRef.current?.focus()
                              return
                            }
                            setIsCustomToneModalOpen(false)
                          }}
                        >
                          Xác nhận
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Force translation regardless of current state when button is clicked
                if (activeTab === 'text') {
                  setTextTranslated(false);
                } else if (activeTab === 'image') {
                  setImageTranslated(false);
                } else if (activeTab === 'file') {
                  setFilesTranslated(false);
                }

                if (activeTab === 'image') {
                  handleImageTranslation(useMarkdownFormat, useFormat);
                } else {
                  handleTranslation();
                }
              }}
              disabled={isTranslateButtonDisabled()}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-white text-sm sm:text-base font-medium transition-all ${isTranslateButtonDisabled()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-900 shadow-sm hover:shadow-md'
                }`}
            >
              {isLoading ? 'Translating...' : 'Translate'}
            </button>

            <button
              onClick={() => setUseMarkdownFormat(!useMarkdownFormat)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${useMarkdownFormat
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              title="Toggle Markdown formatting"
            >
              <DocumentIcon className="h-4 w-4" />
              Markdown Format
            </button>

            <button
              onClick={() => setUseFormat(!useFormat)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${useFormat
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              title="Toggle text formatting"
            >
              <SparklesIcon className="h-4 w-4" />
              Format
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Source Panel */}
          <div className="relative">
            {/* Source Panel Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50/80">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  {activeTab === 'text' ? 'Source Text' : activeTab === 'image' ? 'Source Image' : 'Source File'}
                </span>
              </div>
            </div>

            {/* Source Content */}
            {activeTab === 'file' ? (
              <div className="p-4 sm:p-4">
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        Uploaded Files ({uploadedFiles.length})
                      </h3>
                      <button
                        onClick={() => {
                          setUploadedFiles([]);
                          setTranslatedFiles([]);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            onClick={() => {
                              setUploadedFiles(files => files.filter((_, i) => i !== index));
                              setTranslatedFiles(files => files.filter((_, i) => i !== index));
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex flex-col items-center justify-center h-full text-gray-400 gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors ${isDragging ? 'bg-gray-100/80 border-2 border-dashed border-primary/50' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <DocumentArrowUpIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" />
                    </div>
                    <span className="text-sm sm:text-base font-medium text-center">
                      {isDragging ? 'Drop files here' : 'Upload documents or drag and drop'}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 text-center">
                      Supported formats: {Object.values(SUPPORTED_FILE_TYPES).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ) : activeTab === 'image' ? (
              <div
                ref={imageContainerRef}
                className={`relative h-full cursor-pointer transition-colors ${isDragging
                    ? 'bg-gray-100/80 border-2 border-dashed border-primary/50'
                    : imagePreview ? '' : 'hover:bg-gray-50/50'
                  }`}
                onClick={handleImageContainerClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {imagePreview ? (
                  <div className="relative h-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-full w-auto mx-auto"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                    <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <PhotoIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" />
                    </div>
                    <span className="text-sm sm:text-base font-medium text-center">
                      {isDragging ? 'Drop image here' : 'Click to upload or paste image (Ctrl+V)'}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 text-center">
                      Supported formats: JPG, PNG, GIF (max 10MB)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className={`relative h-full ${isDragging ? 'bg-gray-100/80 border-2 border-dashed border-primary/50' : ''}`}>
                <Textarea
                  ref={sourceTextRef}
                  value={sourceText}
                  onChange={handleTextAreaResize}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleTranslation();
                    }
                  }}
                  style={{ overflow: 'hidden' }}
                  className="w-full p-4 sm:p-4 resize-none focus:outline-none text-base min-h-[300px] sm:min-h-[500px] bg-transparent border border-gray-100"
                  placeholder={isDragging ? 'Drop text file here' : 'Enter text to translate...'}
                />
              </div>
            )}
          </div>

          {/* Translated Text Panel */}
          <div className="relative">
            {/* Translated Panel Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-1 border-b border-gray-200 bg-gray-50/80">
              <div className="text-sm font-medium text-gray-500">Translation</div>
              <div className="flex items-center gap-1">
                {activeTab === 'file' ? (
                  translatedFiles.length > 0 && (
                    <button
                      onClick={handleDownloadAll}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      title="Download translated files"
                    >
                      <ArrowDownTrayIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm"> {translatedFiles.length > 1 ? 'All' : ''}</span>
                    </button>
                  )
                ) : (
                  <>
                    <button
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      onClick={() => handleCopy(translatedText)}
                      title="Copy to clipboard"
                    >
                      <ClipboardIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm"></span>
                    </button>
                    <button
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      onClick={() => handleDownload(translatedText)}
                      title="Download as text file"
                    >
                      <ArrowDownTrayIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm"></span>
                    </button>
                    <button
                      className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                        useMarkdownDisplay 
                          ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setUseMarkdownDisplay(!useMarkdownDisplay)}
                      title={useMarkdownDisplay ? "Chuyển sang hiển thị văn bản thường" : "Chuyển sang hiển thị markdown"}
                    >
                      <DocumentIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                      <span className="text-xs sm:text-sm"></span>
                    </button>
                    <button
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                      onClick={() => handleSpeech(translatedText, targetLanguage, false)}
                      title={isTranslationPlaying ? "Stop" : "Listen to translation"}
                    >
                      {isTranslationPlaying ? (
                        <>
                          <StopIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                          <span className="text-xs sm:text-sm"></span>
                        </>
                      ) : (
                        <>
                          <SpeakerWaveIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                          <span className="text-xs sm:text-sm"></span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div
              ref={translatedTextRef}
              style={{ height: `${contentHeight}px` }}
              className="p-4 sm:p-4 overflow-y-auto min-h-[300px] sm:min-h-[500px]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full border-4 border-primary/30 border-t-transparent animate-spin" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-sm sm:text-base text-gray-700 font-medium">
                        {activeTab === 'image' ? 'Translating image...' : 'Translating text...'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {activeTab === 'image'
                          ? 'AI is analyzing and translating text in the image'
                          : 'AI is processing your text translation'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'file' ? (
                translatedFiles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        Translated Files ({translatedFiles.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {translatedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          </div>
                          <button
                            onClick={() => handleDownloadTranslated(file.name, file.content)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="Download translated file"
                          >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                    <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <DocumentTextIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" />
                    </div>
                    <span className="text-sm sm:text-base font-medium text-center">
                      No translated files yet
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 text-center">
                      Upload files and click Translate to begin
                    </span>
                  </div>
                )
              ) : translatedText ? (
                <div className="prose max-w-none text-gray-800 text-base">
                  {useMarkdownDisplay ? (
                    <ReactMarkdown>{translatedText}</ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{translatedText}</div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    {activeTab === 'image' ? (
                      <PhotoIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" />
                    ) : (
                      <svg className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm sm:text-base font-medium text-center">
                    {activeTab === 'image'
                      ? 'Upload an image or paste from clipboard'
                      : 'Enter text to translate'}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400 text-center">
                    {activeTab === 'image'
                      ? 'Supported formats: JPG, PNG, GIF (max 10MB)'
                      : 'Type or paste your text and click Translate to begin'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
          <svg className="h-4 sm:h-5 w-4 sm:w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm sm:text-base font-medium">{error}</span>
        </div>
      )}
    </div>
  )
} 