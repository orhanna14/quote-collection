import { useState, useEffect } from 'react';
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Input } from './components/ui/input';

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

  // Update localStorage whenever quotes change
  useEffect(() => {
    localStorage.setItem('quotes', JSON.stringify(quotes));
  }, [quotes]);

  // Add quote to collection
  const addQuote = () => {
    if (newQuote.text && newQuote.author) {
      const quoteToAdd = {
        ...newQuote,
        id: Date.now(), // Use timestamp as unique ID
        createdAt: new Date().toISOString()
      };

      setQuotes([quoteToAdd, ...quotes]);
      
      // Reset form
      setNewQuote({ 
        text: '', 
        author: '', 
        category: '',
        id: null 
      });
    }
  };

  // Delete quote
  const deleteQuote = (id) => {
    setQuotes(quotes.filter(quote => quote.id !== id));
  };

  // Bulk upload quotes
  const handleBulkUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        // Try parsing as JSON first
        const importedQuotes = JSON.parse(e.target.result);
        
        // Validate quote structure
        const validQuotes = importedQuotes.map(quote => ({
          id: Date.now() + Math.random(),
          text: quote.text || quote.quote,
          author: quote.author || quote.by || 'Unknown',
          category: quote.category || '',
          importedAt: new Date().toISOString()
        })).filter(quote => quote.text); // Ensure quote text exists

        // Add imported quotes to existing collection
        setQuotes([...validQuotes, ...quotes]);
      } catch (jsonError) {
        // If JSON parsing fails, try CSV
        try {
          const csvText = e.target.result;
          const csvQuotes = parseCSV(csvText);
          
          const validQuotes = csvQuotes.map(quote => ({
            id: Date.now() + Math.random(),
            text: quote.text || quote.quote,
            author: quote.author || quote.by || 'Unknown',
            category: quote.category || '',
            importedAt: new Date().toISOString()
          })).filter(quote => quote.text);

          setQuotes([...validQuotes, ...quotes]);
        } catch (csvError) {
          alert('Unable to parse file. Please use JSON or CSV format.');
        }
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quote Collection</h1>
      
      {/* Bulk Upload Section */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Bulk Upload Quotes</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <Input 
            type="file" 
            accept=".json,.csv"
            onChange={handleBulkUpload}
            className="max-w-md"
          />
          <Button 
            variant="secondary" 
            onClick={generateSampleFiles}
          >
            Download Sample Files
          </Button>
        </CardContent>
      </Card>

      {/* Individual Quote Input Form */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Add New Quote</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Input 
              placeholder="Quote Text" 
              value={newQuote.text}
              onChange={(e) => setNewQuote({
                ...newQuote, 
                text: e.target.value
              })}
            />
            <Input 
              placeholder="Author" 
              value={newQuote.author}
              onChange={(e) => setNewQuote({
                ...newQuote, 
                author: e.target.value
              })}
            />
            <Input 
              placeholder="Category" 
              value={newQuote.category}
              onChange={(e) => setNewQuote({
                ...newQuote, 
                category: e.target.value
              })}
            />
            <Button onClick={addQuote}>Add Quote</Button>
          </div>
        </CardContent>
      </Card>

      {/* Quote List */}
      <div className="space-y-2">
        {quotes.map((quote) => (
          <Card key={quote.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <blockquote className="italic">"{quote.text}"</blockquote>
                <div className="mt-2 text-sm">
                  <strong>- {quote.author}</strong>
                  {quote.category && (
                    <span className="ml-2 text-gray-500">
                      ({quote.category})
                    </span>
                  )}
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => deleteQuote(quote.id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuoteCollection;