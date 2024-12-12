import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    getDocs,
    orderBy
  } from 'firebase/firestore';
  import { auth } from '../firebaseConfig';
  
  // Quote interface
  export interface Quote {
    id?: string;
    text: string;
    author: string;
    category?: string;
    createdAt: string;
    userId: string;
  }
  
  class QuoteService {
    private db;
    private quotesRef;
  
    constructor() {
      this.db = getFirestore();
      this.quotesRef = collection(this.db, 'quotes');
    }
  
    // Add a new quote
    async addQuote(quoteData: Omit<Quote, 'id'>) {
      try {
        const docRef = await addDoc(this.quotesRef, quoteData);
        return { ...quoteData, id: docRef.id };
      } catch (error) {
        console.error("Error adding quote:", error);
        throw error;
      }
    }
  
    // Get quotes for current user
    async getUserQuotes() {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
  
      const q = query(
        this.quotesRef, 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
  
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Quote));
    }
  
    // Update a quote
    async updateQuote(quoteId: string, updatedData: Partial<Quote>) {
      try {
        const quoteRef = doc(this.db, 'quotes', quoteId);
        await updateDoc(quoteRef, updatedData);
        return { id: quoteId, ...updatedData };
      } catch (error) {
        console.error("Error updating quote:", error);
        throw error;
      }
    }
  
    // Delete a quote
    async deleteQuote(quoteId: string) {
      try {
        const quoteRef = doc(this.db, 'quotes', quoteId);
        await deleteDoc(quoteRef);
        return quoteId;
      } catch (error) {
        console.error("Error deleting quote:", error);
        throw error;
      }
    }
  }
  
  export const quoteService = new QuoteService();