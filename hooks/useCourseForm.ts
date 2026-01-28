import { useState, useCallback } from 'react';
import { CourseFormData } from '@/types/course';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export const useCourseForm = (initialCourse?: Partial<CourseFormData>) => {
  const [formData, setFormData] = useState<CourseFormData>(() => ({
    // Core Course Information
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    learningObjectives: [""],
    requirements: [""],
    targetAudience: [""],
    
    // Course Metadata
    category: "",
    subCategory: "",
    tags: [],
    level: "Beginner",
    language: "English",
    duration: 0,
    
    // Pricing & Enrollment
    price: 0,
    originalPrice: 0,
    isFree: false,
    hasDiscount: false,
    enrolledStudents: 0,
    
    // Media
    image: "",
    imageFile: null,
    imagePreview: "",
    
    // Status & Visibility
    isPublished: false,
    isFeatured: false,
    isApproved: false,
    certificateIncluded: false,
    
    // Instructor Information
    instructor: {
      name: "",
      email: "",
      bio: "",
      role: "instructor",
      avatar: ""
    },
    coInstructors: [],
    
    // Course Content
    curriculum: [],
    
    // Reviews & Ratings
    rating: 0,
    totalRatings: 0,
    
    // System Fields
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "",
    version: 1,
    
    // Advanced Settings
    accessType: "public",
    
    // Analytics
    views: 0,
    
    // Additional Features
    hasForum: false,
    hasLiveSessions: false,
    hasQASection: false,
    
    // Spread initial values if provided
    ...initialCourse
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle text/select inputs
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }));
      return;
    }
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
      return;
    }
    
    // Handle regular text inputs
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle array fields (requirements, learningObjectives, etc.)
  const handleArrayChange = useCallback((field: keyof CourseFormData, index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...(prev[field] as string[])];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  }, []);

  // Add new item to array field
  const addArrayItem = useCallback((field: keyof CourseFormData, defaultValue = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), defaultValue]
    }));
  }, []);

  // Remove item from array field
  const removeArrayItem = useCallback((field: keyof CourseFormData, index: number) => {
    setFormData(prev => {
      const newArray = [...(prev[field] as string[])];
      newArray.splice(index, 1);
      return {
        ...prev,
        [field]: newArray
      };
    });
  }, []);

  // Handle file uploads
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  // Upload file to Firebase Storage and return the download URL
  const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (err) {
      console.error('Error uploading file:', err);
      throw new Error('Failed to upload file');
    }
  }, []);

  // Prepare form data for submission (uploads files if needed)
  const prepareSubmitData = useCallback(async (): Promise<Omit<CourseFormData, 'imageFile' | 'imagePreview'>> => {
    const data = { ...formData };
    
    // Upload image if a new file was selected
    if (data.imageFile) {
      try {
        data.image = await uploadFile(data.imageFile, 'courses/images');
      } catch (err) {
        throw new Error('Failed to upload course image');
      }
    }
    
    // Remove temporary fields
    const { imageFile, imagePreview, ...submitData } = data;
    return submitData;
  }, [formData, uploadFile]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setFormData({
      // ... (same as initial state)
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      learningObjectives: [""],
      requirements: [""],
      targetAudience: [""],
      category: "",
      subCategory: "",
      tags: [],
      level: "Beginner",
      language: "English",
      duration: 0,
      price: 0,
      originalPrice: 0,
      isFree: false,
      hasDiscount: false,
      enrolledStudents: 0,
      image: "",
      imageFile: null,
      imagePreview: "",
      isPublished: false,
      isFeatured: false,
      isApproved: false,
      certificateIncluded: false,
      instructor: {
        name: "",
        email: "",
        bio: "",
        role: "instructor",
        avatar: ""
      },
      coInstructors: [],
      curriculum: [],
      rating: 0,
      totalRatings: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "",
      version: 1,
      accessType: "public",
      views: 0,
      hasForum: false,
      hasLiveSessions: false,
      hasQASection: false
    });
  }, []);

  return {
    formData,
    setFormData,
    handleChange,
    handleArrayChange,
    addArrayItem,
    removeArrayItem,
    handleFileChange,
    prepareSubmitData,
    resetForm,
    isSubmitting,
    setIsSubmitting,
    error,
    setError
  };
};
