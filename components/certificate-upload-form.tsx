"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, Image } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { auth } from '@/lib/firebase'

interface CertificateUploadFormProps {
  onSuccess?: () => void
}

export function CertificateUploadForm({ onSuccess }: CertificateUploadFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    userEmail: '',
    courseId: '',
    courseTitle: '',
    enrollmentId: '',
    certificateNumber: '',
    issueDate: '',
    completionDate: '',
    instructorName: 'Coltek Academy',
    templateUsed: 'default',
    grade: '',
  })
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certificateFile) {
      toast({
        title: "Error",
        description: "Please select a certificate PDF file",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const uploadData = new FormData()

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) uploadData.append(key, value)
      })

      // Add files
      uploadData.append('certificate', certificateFile)
      if (previewFile) {
        uploadData.append('preview', previewFile)
      }

      // Get auth token (you'll need to implement proper auth)
      const token = await getAuthToken() // Implement this function

      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed with status ${response.status}`)
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: "Certificate uploaded successfully",
      })

      // Reset form
      setFormData({
        userId: '',
        userEmail: '',
        courseId: '',
        courseTitle: '',
        enrollmentId: '',
        certificateNumber: '',
        issueDate: '',
        completionDate: '',
        instructorName: 'Coltek Academy',
        templateUsed: 'default',
        grade: '',
      })
      setCertificateFile(null)
      setPreviewFile(null)

      onSuccess?.()

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getAuthToken = async () => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated')
    }
    return await auth.currentUser.getIdToken()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Certificate</CardTitle>
        <CardDescription>
          Upload a certificate PDF and optional preview image for a student.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">User Email</Label>
              <Input
                id="userEmail"
                type="email"
                value={formData.userEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Course Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseId">Course ID</Label>
              <Input
                id="courseId"
                value={formData.courseId}
                onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseTitle">Course Title</Label>
              <Input
                id="courseTitle"
                value={formData.courseTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, courseTitle: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enrollmentId">Enrollment ID</Label>
              <Input
                id="enrollmentId"
                value={formData.enrollmentId}
                onChange={(e) => setFormData(prev => ({ ...prev, enrollmentId: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate Number</Label>
              <Input
                id="certificateNumber"
                value={formData.certificateNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, certificateNumber: e.target.value }))}
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completionDate">Completion Date</Label>
              <Input
                id="completionDate"
                type="date"
                value={formData.completionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, completionDate: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructorName">Instructor Name</Label>
              <Input
                id="instructorName"
                value={formData.instructorName}
                onChange={(e) => setFormData(prev => ({ ...prev, instructorName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade (Optional)</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificate">Certificate PDF *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="certificate"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('certificate')?.click()}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {certificateFile ? certificateFile.name : 'Select PDF'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview">Preview Image (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="preview"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('preview')?.click()}
                  className="flex items-center gap-2"
                >
                  <Image className="h-4 w-4" />
                  {previewFile ? previewFile.name : 'Select Image'}
                </Button>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Certificate
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}