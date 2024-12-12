import { useState, useEffect, useMemo } from 'react';
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { useAuth } from './context/AuthContext';
import './QuoteCollection.css'

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_FILE_TYPES = ['application/json', 'text/csv'];
const MAX_QUOTES_PER_UPLOAD = 1000;

const QuoteCollection = () => {
  const { user, signIn, signOutUser } = useAuth();


  // Modify quotes state to be user-specific
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    if (!user) return [];
    const savedQuotes = localStorage.getItem(`quotes_${user.uid}`);
    return savedQuotes ? JSON.parse(savedQuotes) : [];
  });

  const [newQuote, setNewQuote] = useState({
    text: '',
    author: '',
    category: '',
    id: null
  });

  const [editingQuote, setEditingQuote] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Update useEffect to be user-specific
  useEffect(() => {
    if (user) {
      localStorage.setItem(`quotes_${user.uid}`, JSON.stringify(quotes));
    }
  }, [quotes, user]);

  // Add or update quote
  const handleQuoteSubmit = () => {
    if (newQuote.text && newQuote.author) {
      if (editingQuote) {
        // Update existing quote
        setQuotes(quotes.map(quote => 
          quote.id === editingQuote.id 
            ? { ...newQuote, id: editingQuote.id } 
            : quote
        ));
        setEditingQuote(null);
      } else {
        // Add new quote
        const quoteToAdd = {
          ...newQuote,
          id: Date.now(), // Use timestamp as unique ID
          createdAt: new Date().toISOString()
        };

        setQuotes([quoteToAdd, ...quotes]);
      }
      
      // Reset form
      setNewQuote({ 
        text: '', 
        author: '', 
        category: '',
        id: null 
      });
    }
  };


    // Start editing a quote
    const startEditingQuote = (quote) => {
      setEditingQuote(quote);
      setNewQuote({
        text: quote.text,
        author: quote.author,
        category: quote.category,
        id: quote.id
      });
    };

  
  // Delete quote
  const deleteQuote = (id) => {
    setQuotes(quotes.filter(quote => quote.id !== id));
  };


  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(quotes.map(quote => quote.category).filter(Boolean));
    return ['All', ...Array.from(uniqueCategories)];
  }, [quotes]);

  // Filter quotes by category
  const filteredQuotes = useMemo(() => {
    return selectedCategory === 'All' 
      ? quotes 
      : quotes.filter(quote => quote.category === selectedCategory);
  }, [quotes, selectedCategory]);

  // Bulk upload quotes
  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      alert('Please select a file to upload');
      return;
    }

    const file = files[0];
    
    // File validation
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('Only JSON and CSV files are allowed');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be less than 1MB');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) return;
      
      try {
        let validQuotes;
        if (file.type === 'application/json') {
          const importedQuotes = JSON.parse(e.target.result as string);
          
          // Validate array structure
          if (!Array.isArray(importedQuotes)) {
            throw new Error('JSON must contain an array of quotes');
          }

          validQuotes = importedQuotes
            .slice(0, MAX_QUOTES_PER_UPLOAD)
            .map((quote: any) => ({
              id: Date.now() + Math.random(),
              text: sanitizeInput(quote.text || quote.quote || ''),
              author: sanitizeInput(quote.author || quote.by || 'Unknown'),
              category: sanitizeInput(quote.category || ''),
              importedAt: new Date().toISOString()
            }))
            .filter((quote: { text: string; }) => 
              quote.text.length > 0 && 
              quote.text.length <= 1000 && 
              quote.author.length <= 100
            );
        } else {
          const csvQuotes = parseCSV(e.target.result as string);
          validQuotes = csvQuotes
            .slice(0, MAX_QUOTES_PER_UPLOAD)
            .map(quote => ({
              id: Date.now() + Math.random(),
              text: sanitizeInput(quote.text || quote.quote || ''),
              author: sanitizeInput(quote.author || quote.by || 'Unknown'),
              category: sanitizeInput(quote.category || ''),
              importedAt: new Date().toISOString()
            }))
            .filter(quote => 
              quote.text.length > 0 && 
              quote.text.length <= 1000 && 
              quote.author.length <= 100
            );
        }

        if (validQuotes.length === 0) {
          alert('No valid quotes found in file');
          return;
        }

        setQuotes(prevQuotes => [...validQuotes, ...prevQuotes]);
        alert(`Successfully imported ${validQuotes.length} quotes`);
        
      } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing file. Please check the format and try again.');
      }
    };

    reader.readAsText(file);
  };

  // Simple CSV parsing function
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return headers.reduce((obj, header, index) => {
        obj[header.toLowerCase()] = values[index];
        return obj;
      }, {});
    }).filter(quote => quote.text || quote.quote);
  };

  // Generate sample import files
  const generateSampleFiles = () => {
    // JSON Sample
    const jsonSample = JSON.stringify([
      {
        text: "Be the change you wish to see in the world.",
        author: "Mahatma Gandhi",
        category: "Inspiration"
      },
      {
        text: "To be or not to be, that is the question.",
        author: "William Shakespeare",
        category: "Literature"
      }
    ], null, 2);

    const jsonBlob = new Blob([jsonSample], { type: 'application/json' });
    const jsonLink = document.createElement('a');
    jsonLink.href = URL.createObjectURL(jsonBlob);
    jsonLink.download = 'quotes_sample.json';
    
    // CSV Sample
    const csvSample = "text,author,category\n" +
      '"Be the change you wish to see in the world","Mahatma Gandhi","Inspiration"\n' +
      '"To be or not to be, that is the question","William Shakespeare","Literature"';
    
    const csvBlob = new Blob([csvSample], { type: 'text/csv' });
    const csvLink = document.createElement('a');
    csvLink.href = URL.createObjectURL(csvBlob);
    csvLink.download = 'quote_collection.csv';

    // Trigger downloads
    document.body.appendChild(jsonLink);
    document.body.appendChild(csvLink);
    jsonLink.click();
    csvLink.click();
    document.body.removeChild(jsonLink);
    document.body.removeChild(csvLink);
  };

  const sanitizeInput = (input: string): string => {
    if (typeof input !== 'string') return '';
    // Remove HTML tags and trim whitespace
    return input
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 1000); // Maximum length
  };

    // Add authentication UI elements
    if (!user) {
      return (
        <div className="container mx-auto max-w-md py-8 text-center">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Quote Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Please sign in to manage your quotes</p>
              <Button onClick={signIn} className="w-full">
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <header className="bg-gradient-to-r from-blue-100 to-purple-100 text-white p-6">
          <div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Quote Collection</h1>
          <p className="text-blue-500 mt-2">Collect, manage, and cherish your favorite quotes</p>
          <p className="text-gray-600">Welcome, {user.displayName}</p>
          </div>
          <Button variant="destructive" onClick={signOutUser}>
            Sign Out
          </Button>
        </header>

        {/* Bulk Upload Section */}
        <Card className="m-4 border-2 border-gray-100 shadow-sm quote-card">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-xl font-semibold text-gray-700">
              Bulk Upload Quotes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 p-4">
            <Input 
              type="file" 
              accept=".json,.csv"
              onChange={handleBulkUpload}
              className="max-w-md file-input input-focus"
            />
            <Button 
              variant="secondary" 
              className="w-full md:w-auto"
              onClick={generateSampleFiles}
            >
              Download Sample Files
            </Button>
          </CardContent>
        </Card>

        {/* Individual Quote Input Form */}
        <Card className="m-4 border-2 border-gray-100 shadow-sm quote-card">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-xl font-semibold text-gray-700">
            {editingQuote ? 'Edit Quote' : 'Add New Quote'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
            <Input 
                placeholder="Quote Text" 
                value={newQuote.text}
                className="input-focus"
                onChange={(e) => setNewQuote({
                  ...newQuote, 
                  text: e.target.value
                })}
              />
              <Input 
                placeholder="Author" 
                value={newQuote.author}
                className="input-focus"
                onChange={(e) => setNewQuote({
                  ...newQuote, 
                  author: e.target.value
                })}
              />
              <Input 
                placeholder="Category" 
                value={newQuote.category}
                className="input-focus"
                onChange={(e) => setNewQuote({
                  ...newQuote, 
                  category: e.target.value
                })}
              />
              <Button 
                onClick={handleQuoteSubmit}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {editingQuote ? 'Update Quote' : 'Add Quote'}
              </Button>
              {editingQuote && (
                <Button 
                  variant="secondary"
                  className="w-full mt-2"
                  onClick={() => {
                    setEditingQuote(null);
                    setNewQuote({ text: '', author: '', category: '', id: null });
                  }}
                >
                  Cancel Editing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <Card className="m-4 border-2 border-gray-100 shadow-sm quote-card">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-xl font-semibold text-gray-700">
              Filter by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

       {/* Quote List */}
       <div className="p-4 space-y-3">
          {filteredQuotes.length === 0 ? (
            <div className="empty-state">
              {selectedCategory === 'All' 
                ? 'No quotes yet. Start adding some inspiration!' 
                : `No quotes in the "${selectedCategory}" category.`}
            </div>
          ) : (
            filteredQuotes.map((quote) => (
              <Card 
                key={quote.id} 
                className="border-l-4 border-blue-500 quote-card"
              >
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
                  <div>
                    <blockquote className="italic text-gray-800 mb-2">
                      "{quote.text}"
                    </blockquote>
                    <div className="text-sm flex items-center">
                      <strong className="text-gray-700">- {quote.author}</strong>
                      {quote.category && (
                        <span className="category-badge">
                          {quote.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="mt-2 md:mt-0 self-start md:self-auto"
                      onClick={() => startEditingQuote(quote)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="delete-button mt-2 md:mt-0 self-start md:self-auto"
                      onClick={() => deleteQuote(quote.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteCollection;