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
  
  export interface Quote {
    id?: string;
    text?: string;
    author?: string;
    category?: string;
    season?: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
    lifeStage?: 'Early Childhood (3-6 years)' | 
               'Middle Childhood (7-12 years)' | 
               'Adolescence (13-19 years)' | 
               'Early Adulthood (20-40 years)' | 
               'Middle Adulthood (41-65 years)' | 
               'Late Adulthood (65+ years)';
    question?: string;
    answer?: string;
    userId: string;
    createdAt: string;
}
  
  class QuoteService {
    private db;
    private quotesRef;
  
    constructor() {
      this.db = getFirestore();
      this.quotesRef = collection(this.db, 'quotes');
    }
  
    async addQuote(quoteData: Omit<Quote, 'id'>) {
        try {
            // Remove undefined values before sending to Firestore
            const cleanData = Object.fromEntries(
                Object.entries(quoteData).filter(([_, v]) => v !== undefined)
            );

            const docRef = await addDoc(this.quotesRef, cleanData);
            return { ...quoteData, id: docRef.id } as Quote;
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
            // Sanitize data: Remove any undefined or empty string fields
            const cleanData = Object.fromEntries(
                Object.entries(updatedData).filter(([_, v]) => 
                    v !== undefined && v !== ''
                )
            );

            const quoteRef = doc(this.db, 'quotes', quoteId);
            await updateDoc(quoteRef, cleanData);
            return { id: quoteId, ...cleanData };
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