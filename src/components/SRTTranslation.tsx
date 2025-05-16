'use client';

import { useState, useEffect } from 'react';
import { DocumentArrowUpIcon, LanguageIcon, BookOpenIcon, ClipboardIcon, ArrowDownTrayIcon, PencilIcon, XMarkIcon, VideoCameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import Dictionary from '@/components/Dictionary';
import { dictionaryService } from '@/lib/dictionary-service';
import { aiService } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { youtubeService } from '@/lib/youtube-service';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  translatedText: string;
  onSave: (editedText: string) => void;
}

interface SRTEntry {
  id: string;
  from: string;
  to: string;
  text: string;
  translation: string;
  status?: 'translated' | 'error' | 'pending';
}

const ComparisonModal = ({ isOpen, onClose, originalText, translatedText, onSave }: ComparisonModalProps) => {
  const [editedText, setEditedText] = useState('');
  const [entries, setEntries] = useState<Array<SRTEntry>>([]);
  const [translatedEntries, setTranslatedEntries] = useState<Array<SRTEntry>>([]);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const { toast } = useToast();

  // Parse SRT content into entries when modal is opened
  useEffect(() => {
    if (isOpen) {
      setEditedText(translatedText);
      
      // Parse SRT content
      const parseSRT = (content: string) => {
        const entries: SRTEntry[] = [];
        const blocks = content.trim().split(/\n\s*\n/); // Split by empty lines
        
        blocks.forEach(block => {
          const lines = block.trim().split('\n');
          if (lines.length >= 2) {
            const id = lines[0].trim();
            const timecode = lines[1].trim();
            const text = lines.slice(2).join('\n').trim();
            
            if (id && timecode) {
              entries.push({ id, from: timecode.split(' --> ')[0], to: timecode.split(' --> ')[1], text, translation: '', status: 'pending' });
            }
          }
        });
        
        return entries;
      };

      const originalEntries = parseSRT(originalText);
      const translatedEntries = parseSRT(translatedText);
      
      while (translatedEntries.length < originalEntries.length) {
        const index = translatedEntries.length;
        translatedEntries.push({
          id: originalEntries[index].id,
          from: originalEntries[index].from,
          to: originalEntries[index].to,
          text: '',
          translation: '',
          status: 'pending'
        });
      }

      setEntries(originalEntries);
      setTranslatedEntries(translatedEntries);
    }
  }, [isOpen, originalText, translatedText]);

  if (!isOpen) return null;

  const handleTranslationChange = (index: number, value: string) => {
    const newEntries = [...translatedEntries];
    newEntries[index] = { 
      ...newEntries[index],
      text: value,
      status: value.trim() === newEntries[index].text.trim() ? 'pending' : 'translated'
    };
    setTranslatedEntries(newEntries);

    // Reconstruct the full SRT text
    const newText = newEntries.map(entry => 
      `${entry.id}\n${entry.from} --> ${entry.to}\n${entry.text}`
    ).join('\n\n');
    setEditedText(newText);
  };

  const handleSave = () => {
    onSave(editedText);
    onClose();
  };

  const handleDictionaryClick = () => {
    setIsDictionaryOpen(true);
  };

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(editedText);
      toast({
        title: "Thành công",
        description: "Content copied to clipboard",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Failed to copy content",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Thành công",
      description: "Subtitles downloaded successfully",
      variant: "default",
    });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black opacity-30" />
        
        <div className="relative bg-white rounded-lg w-[90vw] h-[90vh] p-4 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium">
              Compare and Edit Subtitles
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col h-[calc(100%-4rem)]">
            <div className="flex gap-4 mb-4">
              <button
                onClick={handleDictionaryClick}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
              >
                <BookOpenIcon className="w-5 h-5" />
                Dictionary
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <ClipboardIcon className="w-5 h-5" />
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 w-16">No.</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 w-36">From</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700 w-36">To</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700">Original Text</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700">Translated Text</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry, index) => {
                    const translatedEntry = translatedEntries[index] || { text: '' };
                    return (
                      <tr 
                        key={index} 
                        className={`hover:bg-gray-50 ${
                          entry.status === 'translated' 
                            ? 'bg-green-50' 
                            : entry.status === 'error' 
                              ? 'bg-red-50' 
                              : ''
                        }`}
                      >
                        <td className="p-3 text-sm text-gray-500 font-mono">
                          <div className="flex items-center gap-2">
                            {entry.id}
                            {entry.status === 'translated' && (
                              <span className="w-2 h-2 rounded-full bg-green-500" title="Đã dịch"></span>
                            )}
                            {entry.status === 'error' && (
                              <span className="w-2 h-2 rounded-full bg-red-500" title="Lỗi khi dịch"></span>
                            )}
                            {entry.status === 'pending' && (
                              <span className="w-2 h-2 rounded-full bg-gray-300" title="Chưa dịch"></span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-500 font-mono">{entry.from}</td>
                        <td className="p-3 text-sm text-gray-500 font-mono">{entry.to}</td>
                        <td className="p-3 text-sm text-gray-900 font-mono whitespace-pre-wrap">{entry.text}</td>
                        <td className="p-3 text-sm text-gray-900 font-mono whitespace-pre-wrap">{translatedEntry.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dictionary
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />
    </Dialog>
  );
};

export default function SRTTranslation() {
  const [srtContent, setSrtContent] = useState('');
  const [entries, setEntries] = useState<Array<SRTEntry>>([]);
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [progressToastId, setProgressToastId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  
  // Custom context states
  const [customContext, setCustomContext] = useState('');
  const [isUsingContext, setIsUsingContext] = useState(false);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [generatedContext, setGeneratedContext] = useState('');
  const [isAutoGeneratingContext, setIsAutoGeneratingContext] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [batchSize, setBatchSize] = useState(50);
  const [isImprovingTranslation, setIsImprovingTranslation] = useState(false);
  const [isRetryingFailedTranslations, setIsRetryingFailedTranslations] = useState(false);
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.srt')) {
      setError('Please upload a .srt file');
      return;
    }

    try {
      const text = await file.text();
      setSrtContent(text);
      setFileName(file.name);

      // Parse SRT content
      const blocks = text.trim().split(/\n\s*\n/);
      const parsedEntries: Array<SRTEntry> = [];
      
      blocks.forEach((block, index) => {
        const lines = block.trim().split('\n');
        if (lines.length >= 3) {
          const id = lines[0].trim();
          const timecode = lines[1].trim();
          const [from, to] = timecode.split(' --> ').map(t => t.trim());
          const text = lines.slice(2).join('\n').trim();
          
          parsedEntries.push({
            id,
            from,
            to,
            text,
            translation: text, // Copy original text to translation when importing
            status: 'pending'
          });
        }
      });

      setEntries(parsedEntries);
      setError(null);
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Error reading SRT file');
    }
  };

  const handleYoutubeSubtitles = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Lỗi",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingYoutube(true);
    const toastId = toast({
      title: "Đang tải",
      description: "Đang tải phụ đề từ YouTube...",
      variant: "default",
    });

    try {
      const data = await youtubeService.fetchSubtitles(youtubeUrl);
      const srtContent = data.subtitles;
      
      // Set the filename using video ID
      setFileName(`youtube_${data.videoId}.srt`);
      
      // Process the SRT content
      const blocks = srtContent.trim().split(/\n\s*\n/);
      const parsedEntries: Array<SRTEntry> = [];
      
      blocks.forEach((block, index) => {
        const lines = block.trim().split('\n');
        if (lines.length >= 3) {
          const id = lines[0].trim();
          const timecode = lines[1].trim();
          const [from, to] = timecode.split(' --> ').map(t => t.trim());
          const text = lines.slice(2).join('\n').trim();
          
          parsedEntries.push({
            id,
            from,
            to,
            text,
            translation: text,
            status: 'pending'
          });
        }
      });

      setEntries(parsedEntries);
      setSrtContent(srtContent);
      setError(null);
      setShowYoutubeInput(false);
      setYoutubeUrl('');
      
      toast({
        title: "Thành công",
        description: "Đã tải phụ đề thành công!",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error fetching YouTube subtitles:', error);
      toast({
        title: "Lỗi",
        description: error.message || 'Failed to fetch subtitles from YouTube',
        variant: "destructive",
      });
    } finally {
      setIsLoadingYoutube(false);
    }
  };

  const handleTranslate = async () => {
    if (!entries.length) return;

    setIsLoading(true);
    setError(null);

    try {
      // Filter only pending entries
      const pendingEntries = entries.filter(entry => entry.status === 'pending');
      if (pendingEntries.length === 0) {
        toast({
          title: "Thông báo",
          description: "Không có câu nào cần dịch.",
          variant: "default",
        });
        return;
      }

      const totalBatches = Math.ceil(pendingEntries.length / batchSize);
      const updatedEntries = [...entries];
      
      const toastId = toast({
        title: "Đang xử lý",
        description: "Bắt đầu dịch phụ đề...",
        variant: "default",
      });
      setProgressToastId(toastId.id);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, pendingEntries.length);
        const batchEntries = pendingEntries.slice(start, end);
        
        const textsToTranslate = batchEntries.map(entry => entry.text);
        const batchText = textsToTranslate.join('\n');

        // Add context to the prompt if available
        const contextInfo = isUsingContext && generatedContext 
          ? `Ngữ cảnh: ${generatedContext}\n\n` 
          : '';

        const prompt = `Dịch các câu sau sang ${targetLanguage}. Đây là phần ${batchIndex + 1}/${totalBatches}. 
${contextInfo}Yêu cầu:
- Chỉ trả về các câu đã dịch
- Mỗi câu một dòng
- Không thêm số thứ tự
- Không thêm bất kỳ chú thích nào khác
- Không thêm dấu gạch đầu dòng
- Giữ nguyên format và ký tự đặc biệt
- Dịch theo ngữ cảnh tự nhiên

Nội dung cần dịch:
${batchText}`;

        const result = await aiService.processWithAI(prompt);
        
        // Split result into lines and apply dictionary
        const translatedLines = result
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('-') && !line.startsWith('['));

        const processedLines = await Promise.all(
          translatedLines.map(line => dictionaryService.applyDictionary(line))
        );

        // Update translations for current batch
        for (let i = 0; i < batchEntries.length; i++) {
          const entryIndex = entries.findIndex(e => 
            e.id === batchEntries[i].id && 
            e.from === batchEntries[i].from && 
            e.to === batchEntries[i].to
          );
          
          if (entryIndex !== -1) {
            if (processedLines[i]) {
              updatedEntries[entryIndex] = {
                ...updatedEntries[entryIndex],
                translation: processedLines[i],
                status: 'translated'
              };
            } else {
              // Mark as error if no translation was returned
              updatedEntries[entryIndex] = {
                ...updatedEntries[entryIndex],
                status: 'error'
              };
            }
          }
        }

        // Update UI after each batch is processed
        setEntries([...updatedEntries]);
        
        // Add delay between batches
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Count statistics
      const stats = getTranslationStats(updatedEntries);
      toast({
        title: "Thành công",
        description: `Dịch hoàn tất! Đã dịch: ${stats.translated}, Lỗi: ${stats.error}, Chưa dịch: ${stats.pending}`,
        variant: "default",
      });
      
    } catch (error: any) {
      console.error('Translation error:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi dịch phụ đề. Vui lòng thử lại sau.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add new function to retry failed translations
  const handleRetryFailedTranslations = async () => {
    if (!entries.length) return;

    setIsLoading(true);
    setError(null);

    try {
      // Filter only error entries
      const failedEntries = entries.filter(entry => entry.status === 'error');
      if (failedEntries.length === 0) {
        toast({
          title: "Thông báo",
          description: "Không có câu nào bị lỗi cần dịch lại.",
          variant: "default",
        });
        return;
      }

      const totalBatches = Math.ceil(failedEntries.length / batchSize);
      const updatedEntries = [...entries];
      
      const toastId = toast({
        title: "Đang xử lý",
        description: "Đang dịch lại các câu bị lỗi...",
        variant: "default",
      });
      setProgressToastId(toastId.id);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, failedEntries.length);
        const batchEntries = failedEntries.slice(start, end);
        
        const textsToTranslate = batchEntries.map(entry => entry.text);
        const batchText = textsToTranslate.join('\n');

        // Add context to the prompt if available
        const contextInfo = isUsingContext && generatedContext 
          ? `Ngữ cảnh: ${generatedContext}\n\n` 
          : '';

        const prompt = `Dịch lại các câu sau sang ${targetLanguage}. Đây là phần ${batchIndex + 1}/${totalBatches}. 
${contextInfo}Yêu cầu:
- Chỉ trả về các câu đã dịch
- Mỗi câu một dòng
- Không thêm số thứ tự
- Không thêm bất kỳ chú thích nào khác
- Không thêm dấu gạch đầu dòng
- Giữ nguyên format và ký tự đặc biệt
- Dịch theo ngữ cảnh tự nhiên

Nội dung cần dịch:
${batchText}`;

        const result = await aiService.processWithAI(prompt);
        
        // Split result into lines and apply dictionary
        const translatedLines = result
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('-') && !line.startsWith('['));

        const processedLines = await Promise.all(
          translatedLines.map(line => dictionaryService.applyDictionary(line))
        );

        // Update translations for current batch
        for (let i = 0; i < batchEntries.length; i++) {
          const entryIndex = entries.findIndex(e => 
            e.id === batchEntries[i].id && 
            e.from === batchEntries[i].from && 
            e.to === batchEntries[i].to
          );
          
          if (entryIndex !== -1) {
            if (processedLines[i]) {
              updatedEntries[entryIndex] = {
                ...updatedEntries[entryIndex],
                translation: processedLines[i],
                status: 'translated'
              };
            } else {
              // Keep as error if no translation was returned
              updatedEntries[entryIndex] = {
                ...updatedEntries[entryIndex],
                status: 'error'
              };
            }
          }
        }

        // Update UI after each batch is processed
        setEntries([...updatedEntries]);
        
        // Add delay between batches
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Count statistics
      const stats = getTranslationStats(updatedEntries);
      toast({
        title: "Thành công",
        description: `Dịch lại hoàn tất! Đã dịch: ${stats.translated}, Lỗi: ${stats.error}, Chưa dịch: ${stats.pending}`,
        variant: "default",
      });
      
    } catch (error: any) {
      console.error('Retry translation error:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi dịch lại phụ đề. Vui lòng thử lại sau.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadOriginal = () => {
    if (!entries.length) return;

    const content = entries.map(entry => 
      `${entry.id}\n${entry.from} --> ${entry.to}\n${entry.text}`
    ).join('\n\n') + '\n';

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.srt', '')}_original.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Thành công",
      description: "Đã tải xuống file phụ đề gốc",
      variant: "default",
    });
  };

  const handleDownloadTranslated = () => {
    if (!entries.length) return;

    const content = entries.map(entry => 
      `${entry.id}\n${entry.from} --> ${entry.to}\n${entry.translation || entry.text}`
    ).join('\n\n') + '\n';

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.srt', '')}_translated.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Thành công",
      description: "Đã tải xuống file phụ đề đã dịch",
      variant: "default",
    });
  };

  const handleCopyOriginal = async () => {
    if (!entries.length) return;

    const content = entries.map(entry => 
      `${entry.id}\n${entry.from} --> ${entry.to}\n${entry.text}`
    ).join('\n\n') + '\n';

    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Thành công",
        description: "Đã sao chép phụ đề gốc",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép phụ đề gốc",
        variant: "destructive",
      });
    }
  };

  const handleCopyTranslated = async () => {
    if (!entries.length) return;

    const content = entries.map(entry => 
      `${entry.id}\n${entry.from} --> ${entry.to}\n${entry.translation || entry.text}`
    ).join('\n\n') + '\n';

    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Thành công",
        description: "Đã sao chép phụ đề đã dịch",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép phụ đề đã dịch",
        variant: "destructive",
      });
    }
  };

  const handleTranslationChange = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      translation: value,
      status: value.trim() === newEntries[index].text.trim() ? 'pending' : 'translated'
    };
    setEntries(newEntries);
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(entries.length / rowsPerPage);
  const paginatedEntries = entries.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRowsPerPage = parseInt(e.target.value);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const handleTranslateRow = async (index: number) => {
    if (isLoading) return;

    try {
      const entry = entries[index];
      const toastId = toast({
        title: "Đang xử lý",
        description: `Đang dịch dòng ${index + 1}...`,
        variant: "default",
      });

      // Add context to the prompt if available
      const contextInfo = isUsingContext && generatedContext 
        ? `Ngữ cảnh: ${generatedContext}\n\n` 
        : '';

      const prompt = `Dịch câu sau sang ${targetLanguage}. 
${contextInfo}Yêu cầu:
- Chỉ trả về câu đã dịch
- Không thêm chú thích
- Giữ nguyên format và ký tự đặc biệt
- Dịch theo ngữ cảnh tự nhiên

Nội dung cần dịch:
${entry.text}`;

      const result = await aiService.processWithAI(prompt);
      const processedResult = await dictionaryService.applyDictionary(result.trim());

      const newEntries = [...entries];
      newEntries[index] = {
        ...entry,
        translation: processedResult,
        status: 'translated'
      };
      setEntries(newEntries);
      setError(null);

      toast({
        title: "Thành công",
        description: `Đã dịch xong dòng ${index + 1}`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      
      // Mark the row as having an error
      const newEntries = [...entries];
      newEntries[index] = {
        ...entries[index],
        status: 'error'
      };
      setEntries(newEntries);
      
      toast({
        title: "Lỗi",
        description: `Lỗi khi dịch dòng ${index + 1}`,
        variant: "destructive",
      });
    }
  };

  // Generate context from custom input or automatically from content
  const handleGenerateContext = async () => {
    if (isGeneratingContext || isAutoGeneratingContext) return;
    
    // If user has entered custom context, use that
    if (customContext.trim()) {
      setIsGeneratingContext(true);
      const toastId = toast({
        title: "Đang xử lý",
        description: "Đang tạo ngữ cảnh từ thông tin người dùng...",
        variant: "default",
      });

      try {
        const prompt = `Dựa trên thông tin sau, hãy tạo một đoạn ngữ cảnh ngắn gọn (tối đa 200 từ) để giúp cho việc dịch phụ đề được chính xác hơn:
${customContext}

Chỉ trả về đoạn ngữ cảnh, không thêm bất kỳ chú thích nào khác.`;

        const result = await aiService.processWithAI(prompt);
        setGeneratedContext(result.trim());
        setIsUsingContext(true);
        toast({
          title: "Thành công",
          description: "Đã tạo ngữ cảnh thành công!",
          variant: "default",
        });
      } catch (error: any) {
        console.error('Context generation error:', error);
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi tạo ngữ cảnh. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingContext(false);
      }
    } 
    // Otherwise, auto-generate from the first 50-100 entries
    else if (entries.length > 0) {
      setIsAutoGeneratingContext(true);
      const toastId = toast({
        title: "Đang xử lý",
        description: "Đang tự động tạo ngữ cảnh từ nội dung...",
        variant: "default",
      });

      try {
        // Take first 50-100 entries (or all if less than 50)
        const sampleSize = Math.min(entries.length, entries.length < 50 ? entries.length : 100);
        const sampleEntries = entries.slice(0, sampleSize);
        const sampleText = sampleEntries.map(entry => entry.text).join('\n');

        const prompt = `Dưới đây là ${sampleSize} câu đầu tiên của một file phụ đề. 
Hãy phân tích nội dung và tạo một đoạn ngữ cảnh ngắn gọn (tối đa 200 từ) mô tả về:
- Thể loại nội dung (phim, phim tài liệu, hội thoại, v.v.)
- Chủ đề chính
- Bối cảnh
- Nhân vật chính (nếu có)
- Các thuật ngữ đặc biệt cần lưu ý khi dịch

Đoạn ngữ cảnh này sẽ được sử dụng để giúp AI dịch phụ đề chính xác hơn.
Chỉ trả về đoạn ngữ cảnh, không thêm bất kỳ chú thích nào khác.

Nội dung phụ đề:
${sampleText}`;

        const result = await aiService.processWithAI(prompt);
        setGeneratedContext(result.trim());
        setIsUsingContext(true);
        toast({
          title: "Thành công",
          description: "Đã tự động tạo ngữ cảnh thành công!",
          variant: "default",
        });
      } catch (error: any) {
        console.error('Auto context generation error:', error);
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi tự động tạo ngữ cảnh. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setIsAutoGeneratingContext(false);
      }
    } else {
      toast({
        title: "Lỗi",
        description: "Không có nội dung để tạo ngữ cảnh. Vui lòng tải lên file phụ đề hoặc nhập ngữ cảnh thủ công.",
        variant: "destructive",
      });
    }
  };

  // Get translation statistics
  const getTranslationStats = (entriesArray = entries) => {
    const stats = {
      translated: 0,
      error: 0,
      pending: 0
    };
    
    entriesArray.forEach(entry => {
      if (entry.status === 'translated') stats.translated++;
      else if (entry.status === 'error') stats.error++;
      else stats.pending++;
    });
    
    return stats;
  };
  
  // Improve translations
  const handleImproveTranslations = async () => {
    const translatedEntries = entries.filter(entry => entry.status === 'translated');
    if (translatedEntries.length === 0) {
      toast({
        title: "Lỗi",
        description: "Không có dòng nào đã dịch để cải thiện.",
        variant: "destructive",
      });
      return;
    }
    
    setIsImprovingTranslation(true);
    const toastId = toast({
      title: "Đang xử lý",
      description: "Đang cải thiện bản dịch...",
      variant: "default",
    });
    
    try {
      // Take a batch of translations to improve
      const batchSize = 20; // Smaller batch size for improvement
      const totalBatches = Math.ceil(translatedEntries.length / batchSize);
      const updatedEntries = [...entries];
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, translatedEntries.length);
        const batchEntries = translatedEntries.slice(start, end);
        
        // Create pairs of original and translated text
        const translationPairs = batchEntries.map(entry => ({
          original: entry.text,
          translation: entry.translation
        }));
        
        // Add context to the prompt if available
        const contextInfo = isUsingContext && generatedContext 
          ? `Ngữ cảnh: ${generatedContext}\n\n` 
          : '';

        const prompt = `Cải thiện các bản dịch sau sang ${targetLanguage}. Đây là phần ${batchIndex + 1}/${totalBatches}.
${contextInfo}Yêu cầu:
- Chỉ trả về các câu đã cải thiện
- Mỗi câu một dòng
- Không thêm số thứ tự
- Không thêm bất kỳ chú thích nào khác
- Không thêm dấu gạch đầu dòng
- Giữ nguyên format và ký tự đặc biệt
- Dịch theo ngữ cảnh tự nhiên
- Đảm bảo dịch chính xác và tự nhiên

Dưới đây là các cặp câu gốc và bản dịch hiện tại:
${translationPairs.map((pair, idx) => `${idx + 1}. Gốc: ${pair.original}\n   Dịch: ${pair.translation}`).join('\n\n')}

Chỉ trả về các bản dịch đã cải thiện, mỗi dòng một câu, theo thứ tự tương ứng.`;

        const result = await aiService.processWithAI(prompt);
        
        // Split result into lines and apply dictionary
        const improvedLines = result
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('-') && !line.startsWith('['));

        const processedLines = await Promise.all(
          improvedLines.map(line => dictionaryService.applyDictionary(line))
        );

        // Update translations for current batch
        for (let i = 0; i < batchEntries.length; i++) {
          if (processedLines[i]) {
            const entryIndex = entries.findIndex(e => 
              e.id === batchEntries[i].id && 
              e.from === batchEntries[i].from && 
              e.to === batchEntries[i].to
            );
            
            if (entryIndex !== -1) {
              updatedEntries[entryIndex] = {
                ...updatedEntries[entryIndex],
                translation: processedLines[i],
                status: 'translated'
              };
            }
          }
        }

        // Update UI after each batch is processed
        setEntries([...updatedEntries]);
        
        // Add delay between batches
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      toast({
        title: "Thành công",
        description: "Cải thiện bản dịch hoàn tất!",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error improving translations:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cải thiện bản dịch. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsImprovingTranslation(false);
    }
  };

  // Calculate translation statistics
  const stats = getTranslationStats();

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 space-y-4">
        <div className="flex flex-col gap-4">
          {/* File Upload Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".srt"
                className="w-64 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              <button
                onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <VideoCameraIcon className="h-5 w-5" />
                YouTube
              </button>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-48 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              >
                {[20, 50, 100, 200].map((size) => (
                  <option key={size} value={size}>
                    {size} câu/lần
                  </option>
                ))}
              </select>

            </div>
            <button
              onClick={() => setIsDictionaryOpen(true)}
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors duration-200"
            >
              <BookOpenIcon className="h-5 w-5" />
              <span>Từ điển</span>
            </button>
          </div>

          {/* YouTube URL input */}
          {showYoutubeInput && (
            <div className="flex gap-2">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Nhập URL video YouTube..."
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                onClick={handleYoutubeSubtitles}
                disabled={isLoadingYoutube || !youtubeUrl.trim()}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 ${
                  isLoadingYoutube || !youtubeUrl.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoadingYoutube ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Đang tải...
                  </span>
                ) : (
                  <>
                    <VideoCameraIcon className="h-5 w-5" />
                    Tải phụ đề
                  </>
                )}
              </button>
            </div>
          )}

          {/* Translation actions and stats */}
          {entries.length > 0 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleImproveTranslations}
                  disabled={isLoading || isImprovingTranslation || stats.translated === 0}
                  className={`py-2 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 ${
                    isLoading || isImprovingTranslation || stats.translated === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isImprovingTranslation ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Đang cải thiện...
                    </span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      Cải thiện bản dịch
                    </>
                  )}
                </button>
                <button
                  onClick={handleRetryFailedTranslations}
                  disabled={isLoading || stats.error === 0}
                  className={`py-2 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 ${
                    isLoading || stats.error === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-5 w-5" />
                      Dịch lại các câu lỗi
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-sm text-gray-600">Đã dịch: {stats.translated}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="text-sm text-gray-600">Lỗi: {stats.error}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                  <span className="text-sm text-gray-600">Chưa dịch: {stats.pending}</span>
                </div>
              </div>
            </div>
          )}
          {/* Custom context input */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Ngữ cảnh tùy chỉnh</h3>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={isUsingContext}
                    onChange={(e) => setIsUsingContext(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  Sử dụng ngữ cảnh
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <textarea
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="Nhập ngữ cảnh, có thể là xưng hô, bối cảnh nhân vật..."
                className="flex-1 p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px] resize-none"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleGenerateContext}
                  disabled={isGeneratingContext || isAutoGeneratingContext || (!customContext.trim() && entries.length === 0)}
                  className={`py-2 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 ${
                    isGeneratingContext || isAutoGeneratingContext || (!customContext.trim() && entries.length === 0)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-800 hover:bg-gray-900 shadow-sm hover:shadow-md'
                  }`}
                  title={customContext.trim() ? "Tạo ngữ cảnh từ thông tin người dùng" : "Tự động tạo ngữ cảnh từ nội dung phụ đề"}
                >
                  {isGeneratingContext || isAutoGeneratingContext ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Đang tạo...
                    </span>
                  ) : (
                    <>
                      <BookOpenIcon className="h-5 w-5" />
                      {customContext.trim() ? "Tạo ngữ cảnh" : "Tạo ngữ cảnh bằng AI"}
                    </>
                  )}
                </button>
                <button
                onClick={handleTranslate}
                disabled={isLoading || !entries.length || isImprovingTranslation}
                className={`py-2 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 ${
                  isLoading || !entries.length || isImprovingTranslation
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 shadow-sm hover:shadow-md'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  <>
                    <LanguageIcon className="h-5 w-5" />
                    Bắt đầu dịch
                  </>
                )}
              </button>
              </div>
            </div>
            {generatedContext && (
              <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-primary">Ngữ cảnh đã tạo:</span>
                  <button
                    onClick={() => {
                      setGeneratedContext('');
                      setIsUsingContext(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Xóa ngữ cảnh"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="whitespace-pre-wrap">{generatedContext}</p>
              </div>
            )}
          </div>
        </div>

        {error && error.startsWith('Đang xử lý') ? (
          <div className="p-4 rounded-lg bg-blue-50 text-blue-600">
            {error}
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 text-red-600">
            {error}
          </div>
        ) : null}

        {entries.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Số dòng mỗi trang:</span>
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              >
                {[100, 200, 500, 1000].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Hiển thị {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, entries.length)} trên tổng số {entries.length} dòng
            </div>
          </div>
        )}

        {/* New toolbar with download and copy buttons */}
        {entries.length > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadOriginal}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Tải phụ đề gốc
              </button>
              <button
                onClick={handleDownloadTranslated}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Tải phụ đề đã dịch
              </button>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyOriginal}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ClipboardIcon className="h-4 w-4" />
                Sao chép phụ đề gốc
              </button>
              <button
                onClick={handleCopyTranslated}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ClipboardIcon className="h-4 w-4" />
                Sao chép phụ đề đã dịch
              </button>
            </div>
          </div>
        )}

        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-16">No.</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-36">From</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700 w-36">To</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Original Text</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Translated Text</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEntries.map((entry, index) => {
                const actualIndex = (currentPage - 1) * rowsPerPage + index;
                return (
                  <tr 
                    key={actualIndex} 
                    className={`hover:bg-gray-50 ${
                      entry.status === 'translated' 
                        ? 'bg-green-50' 
                        : entry.status === 'error' 
                          ? 'bg-red-50' 
                          : ''
                    }`}
                  >
                    <td className="p-3 text-sm text-gray-500 font-mono">
                      <div className="flex items-center gap-2">
                        {entry.id}
                        {entry.status === 'translated' && (
                          <span className="w-2 h-2 rounded-full bg-green-500" title="Đã dịch"></span>
                        )}
                        {entry.status === 'error' && (
                          <span className="w-2 h-2 rounded-full bg-red-500" title="Lỗi khi dịch"></span>
                        )}
                        {entry.status === 'pending' && (
                          <span className="w-2 h-2 rounded-full bg-gray-300" title="Chưa dịch"></span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-500 font-mono">{entry.from}</td>
                    <td className="p-3 text-sm text-gray-500 font-mono">{entry.to}</td>
                    <td className="p-3 text-sm text-gray-900 font-mono whitespace-pre-wrap">{entry.text}</td>
                    <td className="p-3 text-sm text-gray-900 font-mono">
                      <div className="flex gap-2">
                        <textarea
                          value={entry.translation}
                          onChange={(e) => handleTranslationChange(actualIndex, e.target.value)}
                          className={`flex-1 p-2 text-sm font-mono border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[60px] resize-none whitespace-pre-wrap ${
                            entry.status === 'translated' 
                              ? 'border-green-200 bg-green-50' 
                              : entry.status === 'error' 
                                ? 'border-red-200 bg-red-50' 
                                : 'border-gray-200'
                          }`}
                        />
                        <button
                          onClick={() => handleTranslateRow(actualIndex)}
                          disabled={isLoading}
                          className="self-start p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Dịch dòng này"
                        >
                          <LanguageIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {entries.length > 0 && totalPages > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              &laquo;
            </button>
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              &lsaquo;
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              &rsaquo;
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              &raquo;
            </button>
          </div>
        )}


      </div>

      <Dictionary
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />
    </div>
  );
} 