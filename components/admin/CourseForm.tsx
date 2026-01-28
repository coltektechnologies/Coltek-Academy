import React, { useEffect } from 'react';
import { useCourseForm } from '@/hooks/useCourseForm';
import { Course, CourseFormData } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CourseFormProps {
  initialData?: Partial<Course>;
  onSubmit: (data: Omit<CourseFormData, 'imageFile' | 'imagePreview'>) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export const CourseForm: React.FC<CourseFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  error: propError,
}) => {
  const {
    formData,
    setFormData,
    handleChange,
    handleArrayChange,
    addArrayItem,
    removeArrayItem,
    handleFileChange,
    isSubmitting: isFormSubmitting,
    error: formError,
    setError: setFormError,
    prepareSubmitData,
  } = useCourseForm(initialData);

  const error = propError || formError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = await prepareSubmitData();
      await onSubmit(submitData);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, formData.slug, setFormData]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details of your course.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Introduction to Web Development"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="e.g., introduction-to-web-dev"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description *</Label>
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="A brief description of your course"
                  maxLength={160}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {formData.shortDescription.length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of your course"
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Course Image</Label>
                <div className="flex items-center gap-4">
                  {formData.imagePreview ? (
                    <img
                      src={formData.imagePreview}
                      alt="Course preview"
                      className="h-32 w-32 rounded-md object-cover"
                    />
                  ) : formData.image ? (
                    <img
                      src={formData.image}
                      alt="Course preview"
                      className="h-32 w-32 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-md bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <div>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="image"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {formData.image || formData.imagePreview ? 'Change' : 'Upload'} Image
                    </Label>
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended size: 1280x720px (16:9)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Requirements</CardTitle>
                  <CardDescription>
                    What students should know before taking this course
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('requirements')}
                >
                  Add Requirement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={req}
                    onChange={(e) =>
                      handleArrayChange('requirements', index, e.target.value)
                    }
                    placeholder="e.g., Basic understanding of HTML and CSS"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeArrayItem('requirements', index)}
                    disabled={formData.requirements.length <= 1}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Course Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>
                Provide additional details about your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g., Web Development"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subCategory">Subcategory</Label>
                  <Input
                    id="subCategory"
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    placeholder="e.g., JavaScript"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') =>
                      setFormData(prev => ({ ...prev, level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language *</Label>
                  <Input
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    placeholder="e.g., English"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price (USD)</Label>
                  <Input
                    id="originalPrice"
                    name="originalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFree"
                    checked={formData.isFree}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, isFree: checked }))
                    }
                  />
                  <Label htmlFor="isFree">This course is free</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasDiscount"
                    checked={formData.hasDiscount}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, hasDiscount: checked }))
                    }
                  />
                  <Label htmlFor="hasDiscount">This course is on sale</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="certificateIncluded"
                    checked={formData.certificateIncluded}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, certificateIncluded: checked }))
                    }
                  />
                  <Label htmlFor="certificateIncluded">Certificate of completion included</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
              <CardDescription>
                Organize your course content into sections and lectures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.curriculum.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No sections added yet</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        // Add a new section
                        const newSection = {
                          id: `section-${Date.now()}`,
                          title: 'New Section',
                          description: '',
                          duration: 0,
                          order: formData.curriculum.length,
                          resources: []
                        };
                        setFormData(prev => ({
                          ...prev,
                          curriculum: [...prev.curriculum, newSection]
                        }));
                      }}
                    >
                      Add Section
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {formData.curriculum.map((section, sectionIndex) => (
                      <div key={section.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium">
                            {section.title || 'Untitled Section'}
                          </h3>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Add a new lecture to this section
                                const newLecture = {
                                  id: `lecture-${Date.now()}`,
                                  title: 'New Lecture',
                                  duration: 0,
                                  type: 'video',
                                  isPreview: false
                                };
                                const newCurriculum = [...formData.curriculum];
                                newCurriculum[sectionIndex].resources = [
                                  ...(newCurriculum[sectionIndex].resources || []),
                                  newLecture
                                ];
                                setFormData(prev => ({
                                  ...prev,
                                  curriculum: newCurriculum
                                }));
                              }}
                            >
                              Add Lecture
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Remove section
                                const newCurriculum = formData.curriculum.filter(
                                  (_, i) => i !== sectionIndex
                                );
                                setFormData(prev => ({
                                  ...prev,
                                  curriculum: newCurriculum
                                }));
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <Input
                            value={section.title}
                            onChange={(e) => {
                              const newCurriculum = [...formData.curriculum];
                              newCurriculum[sectionIndex].title = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                curriculum: newCurriculum
                              }));
                            }}
                            placeholder="Section title"
                            className="font-medium"
                          />
                          <Textarea
                            value={section.description || ''}
                            onChange={(e) => {
                              const newCurriculum = [...formData.curriculum];
                              newCurriculum[sectionIndex].description = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                curriculum: newCurriculum
                              }));
                            }}
                            placeholder="Section description (optional)"
                            rows={2}
                          />
                        </div>

                        {section.resources && section.resources.length > 0 && (
                          <div className="space-y-2 mt-4">
                            {section.resources.map((lecture, lectureIndex) => (
                              <div
                                key={lecture.id}
                                className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-muted-foreground text-sm">
                                    {lectureIndex + 1}.
                                  </span>
                                  <div>
                                    <p className="font-medium">
                                      {lecture.title || 'Untitled Lecture'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {lecture.type} • {lecture.duration} min
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Toggle preview
                                      const newCurriculum = [...formData.curriculum];
                                      newCurriculum[sectionIndex].resources = [
                                        ...newCurriculum[sectionIndex].resources
                                      ];
                                      newCurriculum[sectionIndex].resources[lectureIndex] = {
                                        ...lecture,
                                        isPreview: !lecture.isPreview
                                      };
                                      setFormData(prev => ({
                                        ...prev,
                                        curriculum: newCurriculum
                                      }));
                                    }}
                                  >
                                    {lecture.isPreview ? 'Preview' : 'Make Preview'}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Remove lecture
                                      const newCurriculum = [...formData.curriculum];
                                      newCurriculum[sectionIndex].resources = newCurriculum[
                                        sectionIndex
                                      ].resources.filter((_, i) => i !== lectureIndex);
                                      setFormData(prev => ({
                                        ...prev,
                                        curriculum: newCurriculum
                                      }));
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Add a new section
                        const newSection = {
                          id: `section-${Date.now()}`,
                          title: 'New Section',
                          description: '',
                          duration: 0,
                          order: formData.curriculum.length,
                          resources: []
                        };
                        setFormData(prev => ({
                          ...prev,
                          curriculum: [...prev.curriculum, newSection]
                        }));
                      }}
                    >
                      Add Section
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
              <CardDescription>
                Configure additional settings for your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Course Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isPublished">Publish Course</Label>
                      <p className="text-sm text-muted-foreground">
                        Make this course visible to students
                      </p>
                    </div>
                    <Switch
                      id="isPublished"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, isPublished: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isFeatured">Featured Course</Label>
                      <p className="text-sm text-muted-foreground">
                        Show this course in featured sections
                      </p>
                    </div>
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, isFeatured: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="hasForum">Enable Discussion Forum</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow students to discuss course content
                      </p>
                    </div>
                    <Switch
                      id="hasForum"
                      checked={formData.hasForum}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, hasForum: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="hasQASection">Enable Q&A Section</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow students to ask questions
                      </p>
                    </div>
                    <Switch
                      id="hasQASection"
                      checked={formData.hasQASection}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, hasQASection: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Access Control</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessType">Access Type</Label>
                    <Select
                      value={formData.accessType}
                      onValueChange={(value: 'public' | 'private' | 'subscription') =>
                        setFormData(prev => ({ ...prev, accessType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select access type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public (Anyone can enroll)</SelectItem>
                        <SelectItem value="private">Private (Invite only)</SelectItem>
                        <SelectItem value="subscription">Subscription (Requires subscription)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.accessType === 'private' && (
                    <div className="space-y-2">
                      <Label>Allowed Users</Label>
                      <div className="flex items-center space-x-2">
                        <Input placeholder="Enter user emails (comma separated)" />
                        <Button type="button" variant="outline">
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Completion & Certification</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="completionCriteria.minProgress">
                      Minimum Progress for Completion (%)
                    </Label>
                    <Input
                      id="completionCriteria.minProgress"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.completionCriteria?.minProgress || 80}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          completionCriteria: {
                            ...prev.completionCriteria,
                            minProgress: Number(e.target.value)
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="completionCriteria.minQuizScore">
                      Minimum Quiz Score for Completion (%)
                    </Label>
                    <Input
                      id="completionCriteria.minQuizScore"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.completionCriteria?.minQuizScore || 70}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          completionCriteria: {
                            ...prev.completionCriteria,
                            minQuizScore: Number(e.target.value)
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireAssignment"
                      checked={formData.completionCriteria?.requireAssignment || false}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({
                          ...prev,
                          completionCriteria: {
                            ...prev.completionCriteria,
                            requireAssignment: checked
                          }
                        }))
                      }
                    />
                    <Label htmlFor="requireAssignment">
                      Require assignment submission for completion
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4 pt-6">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Course'}
        </Button>
      </div>
    </form>
  );
};
