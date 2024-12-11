import { useState, useEffect, useMemo } from 'react';
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import './App.css'

const QuoteCollection = () => {
  // Initialize state from localStorage or empty array
  const [quotes, setQuotes] = useState(() => {
    const savedQuotes = localStorage.getItem('quotes');
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

  // Update localStorage whenever quotes change
  useEffect(() => {
    localStorage.setItem('quotes', JSON.stringify(quotes));
  }, [quotes]);

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
    console.log('Upload initiated');
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      alert('Please select a file to upload');
      return;
    }

    const file = files[0];
    console.log('File selected:', file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      console.log('File read completed');
      if (!e.target?.result) {
        console.log('No result from file read');
        return;
      }
      try {
        // Try parsing as JSON first
        console.log('Attempting to parse JSON');
        const importedQuotes = JSON.parse(e.target.result as string);
        console.log('Parsed quotes:', importedQuotes);
        
        // Validate quote structure
        const validQuotes = importedQuotes.map((quote: any) => ({
          id: Date.now() + Math.random(),
          text: quote.text || quote.quote,
          author: quote.author || quote.by || 'Unknown',
          category: quote.category || '',
          importedAt: new Date().toISOString()
        })).filter((quote: { text: any; }) => quote.text);

        console.log('Valid quotes to add:', validQuotes);
        // Add imported quotes to existing collection
        setQuotes(prevQuotes => [...validQuotes, ...prevQuotes]);
        alert(`Successfully imported ${validQuotes.length} quotes`);
      } catch (jsonError) {
        console.log('JSON parsing failed, attempting CSV parse');
        // If JSON parsing fails, try CSV
        try {
          const csvText = e.target.result as string;
          const csvQuotes = parseCSV(csvText);
          
          const validQuotes = csvQuotes.map(quote => ({
            id: Date.now() + Math.random(),
            text: quote.text || quote.quote,
            author: quote.author || quote.by || 'Unknown',
            category: quote.category || '',
            importedAt: new Date().toISOString()
          })).filter(quote => quote.text);

          console.log('Valid CSV quotes to add:', validQuotes);
          setQuotes(prevQuotes => [...validQuotes, ...prevQuotes]);
          alert(`Successfully imported ${validQuotes.length} quotes`);
        } catch (csvError) {
          console.error('CSV parsing failed:', csvError);
          alert('Unable to parse file. Please use JSON or CSV format.');
        }
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Error reading file');
    };

    try {
      console.log('Starting file read');
      reader.readAsText(file);
    } catch (error) {
      console.error('Error initiating file read:', error);
      alert('Error reading file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
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
    csvLink.download = 'quotes_sample.csv';

    // Trigger downloads
    document.body.appendChild(jsonLink);
    document.body.appendChild(csvLink);
    jsonLink.click();
    csvLink.click();
    document.body.removeChild(jsonLink);
    document.body.removeChild(csvLink);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <header className="bg-gradient-to-r from-blue-100 to-purple-100 text-white p-6">
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Quote Collection</h1>
          <p className="text-blue-500 mt-2">Collect, manage, and cherish your favorite quotes</p>
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