import { collection, doc, getDocs, query, where, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { getStorage } from 'firebase/storage'
import { db } from './firebase'
import type { Certificate } from './types'

const storage = getStorage()

export class CertificateService {
  private static COLLECTION = 'certificates'

  /**
   * Get all certificates for a user
   */
  static async getUserCertificates(userId: string): Promise<Certificate[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'issued'),
        orderBy('issueDate', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        issueDate: doc.data().issueDate.toDate(),
        completionDate: doc.data().completionDate.toDate(),
      })) as Certificate[]
    } catch (error) {
      console.error('Error fetching user certificates:', error)
      throw new Error('Failed to fetch certificates')
    }
  }

  /**
   * Get certificate by ID
   */
  static async getCertificateById(certificateId: string): Promise<Certificate | null> {
    try {
      const docRef = doc(db, this.COLLECTION, certificateId)
      const docSnap = await getDocs(query(collection(db, this.COLLECTION), where('id', '==', certificateId)))

      if (!docSnap.empty) {
        const data = docSnap.docs[0].data()
        return {
          ...data,
          id: docSnap.docs[0].id,
          issueDate: data.issueDate.toDate(),
          completionDate: data.completionDate.toDate(),
        } as Certificate
      }
      return null
    } catch (error) {
      console.error('Error fetching certificate:', error)
      throw new Error('Failed to fetch certificate')
    }
  }

  /**
   * Upload certificate files to Firebase Storage
   */
  static async uploadCertificateFiles(
    certificateId: string,
    pdfFile: File,
    previewFile?: File
  ): Promise<{ certificateUrl: string; previewUrl?: string }> {
    try {
      const results: { certificateUrl: string; previewUrl?: string } = {
        certificateUrl: ''
      }

      // Upload PDF
      const pdfRef = ref(storage, `certificates/${certificateId}/certificate.pdf`)
      await uploadBytes(pdfRef, pdfFile)
      results.certificateUrl = await getDownloadURL(pdfRef)

      // Upload preview image if provided
      if (previewFile) {
        const previewRef = ref(storage, `certificates/${certificateId}/preview.jpg`)
        await uploadBytes(previewRef, previewFile)
        results.previewUrl = await getDownloadURL(previewRef)
      }

      return results
    } catch (error) {
      console.error('Error uploading certificate files:', error)
      throw new Error('Failed to upload certificate files')
    }
  }

  /**
   * Create a new certificate
   */
  static async createCertificate(certificateData: Omit<Certificate, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...certificateData,
        issueDate: new Date(certificateData.issueDate),
        completionDate: new Date(certificateData.completionDate),
        status: 'issued',
      })

      // Update the document with its ID
      await updateDoc(docRef, { id: docRef.id })

      return docRef.id
    } catch (error) {
      console.error('Error creating certificate:', error)
      throw new Error('Failed to create certificate')
    }
  }

  /**
   * Update certificate
   */
  static async updateCertificate(certificateId: string, updates: Partial<Certificate>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, certificateId)
      await updateDoc(docRef, {
        ...updates,
        ...(updates.issueDate && { issueDate: new Date(updates.issueDate) }),
        ...(updates.completionDate && { completionDate: new Date(updates.completionDate) }),
      })
    } catch (error) {
      console.error('Error updating certificate:', error)
      throw new Error('Failed to update certificate')
    }
  }

  /**
   * Revoke certificate
   */
  static async revokeCertificate(certificateId: string): Promise<void> {
    try {
      await this.updateCertificate(certificateId, { status: 'revoked' })
    } catch (error) {
      console.error('Error revoking certificate:', error)
      throw new Error('Failed to revoke certificate')
    }
  }

  /**
   * Delete certificate and its files
   */
  static async deleteCertificate(certificateId: string): Promise<void> {
    try {
      // Get certificate data first
      const certificate = await this.getCertificateById(certificateId)
      if (!certificate) return

      // Delete files from storage
      const filesToDelete = [
        `certificates/${certificateId}/certificate.pdf`,
        certificate.previewUrl ? `certificates/${certificateId}/preview.jpg` : null,
      ].filter(Boolean) as string[]

      for (const filePath of filesToDelete) {
        try {
          const fileRef = ref(storage, filePath)
          await deleteObject(fileRef)
        } catch (error) {
          console.warn(`Failed to delete file ${filePath}:`, error)
        }
      }

      // Delete document
      await deleteDoc(doc(db, this.COLLECTION, certificateId))
    } catch (error) {
      console.error('Error deleting certificate:', error)
      throw new Error('Failed to delete certificate')
    }
  }

  /**
   * Generate certificate number
   */
  static generateCertificateNumber(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `CERT-${timestamp}-${random}`
  }

  /**
   * Generate verification code
   */
  static generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  /**
   * Check if user is an admin
   */
  static async checkAdminStatus(userId: string): Promise<boolean> {
    try {
      const adminDoc = await getDocs(query(collection(db, 'adminUsers'), where('uid', '==', userId)))
      return !adminDoc.empty && adminDoc.docs[0].data()?.role === 'admin'
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }
}