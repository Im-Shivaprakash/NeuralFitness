import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // Test collection - we'll use a dedicated test collection to not interfere with real data
    const testCollection = collection(db, 'firestoreTest');
    
    // Create a test document
    const testData = {
      message: 'Test document',
      timestamp: new Date().toISOString(),
      randomValue: Math.random()
    };
    
    // Attempt to write to Firestore
    const writeResult = await addDoc(testCollection, testData);
    
    // Attempt to read from Firestore
    const querySnapshot = await getDocs(testCollection);
    const documents = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    return res.status(200).json({
      success: true,
      message: 'Firestore connection and permissions test successful',
      data: {
        writeResult: writeResult.id,
        documentsCount: documents.length,
        sampleDocuments: documents.slice(0, 3) // Return up to 3 sample documents
      }
    });
  } catch (error: any) {
    console.error('Firestore test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Firestore test failed',
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    });
  }
} 