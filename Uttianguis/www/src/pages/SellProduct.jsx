"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { uploadFile } from "../services/fileService"
import { createProduct } from "../services/productService"
import { getCategories } from "../services/categoryService"
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Container,
  Grid,
  Paper,
} from "@mui/material"
import { Camera, Upload } from "lucide-react"
import { toast } from "react-toastify"
import LoadingButton from "../components/LoadingButton"
import ImagePreview from "../components/ImagePreview"
import { useNetworkStatus } from "../hooks/useNetworkStatus"

const SellProduct = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const { isOnline } = useNetworkStatus()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "new",
    contactMethod: "whatsapp",
    location: user?.location || "", // Add location with default from user profile
  })

  const [images, setImages] = useState([])
  const [previewImages, setPreviewImages] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data)
        // Set default category if available
        if (data.length > 0 && !formData.category) {
          setFormData((prev) => ({ ...prev, category: data[0]._id }))
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast.error("Could not load categories")
      }
    }

    fetchCategories()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Limit to 5 images total
    if (images.length + files.length > 5) {
      toast.warning("You can upload a maximum of 5 images")
      return
    }

    // Create preview URLs
    const newPreviewImages = files.map((file) => URL.createObjectURL(file))
    setPreviewImages((prev) => [...prev, ...newPreviewImages])
    setImages((prev) => [...prev, ...files])

    // Reset file input
    e.target.value = null
  }

  const handleCameraCapture = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Limit to 5 images total
    if (images.length + files.length > 5) {
      toast.warning("You can upload a maximum of 5 images")
      return
    }

    // Create preview URLs
    const newPreviewImages = files.map((file) => URL.createObjectURL(file))
    setPreviewImages((prev) => [...prev, ...newPreviewImages])
    setImages((prev) => [...prev, ...files])

    // Reset camera input
    e.target.value = null
  }

  const removeImage = (index) => {
    // Release object URL to prevent memory leaks
    URL.revokeObjectURL(previewImages[index])

    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.price) newErrors.price = "Price is required"
    if (isNaN(formData.price) || Number.parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }
    if (!formData.category) newErrors.category = "Category is required"
    if (images.length === 0) newErrors.images = "At least one image is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    if (!isOnline) {
      toast.error("You are offline. Please connect to the internet to post your product.")
      return
    }

    setLoading(true)

    try {
      // Upload images first
      const imageUrls = []
      for (const image of images) {
        const imageUrl = await uploadFile(image)
        imageUrls.push(imageUrl)
      }

      // Create product with image URLs
      const productData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        images: imageUrls,
        owner: user._id,
      }

      const newProduct = await createProduct(productData)

      toast.success("Product listed successfully!")
      navigate(`/product/${newProduct._id}`)
    } catch (error) {
      console.error("Error creating product:", error)
      toast.error(error.message || "Failed to create product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sell a Product
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price (MXN)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                InputProps={{ startAdornment: "$" }}
                error={!!errors.price}
                helperText={errors.price}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select name="category" value={formData.category} onChange={handleChange} label="Category">
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error">
                    {errors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select name="condition" value={formData.condition} onChange={handleChange} label="Condition">
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="like-new">Like New</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Contact Method</InputLabel>
                <Select
                  name="contactMethod"
                  value={formData.contactMethod}
                  onChange={handleChange}
                  label="Contact Method"
                >
                  <MenuItem value="whatsapp">WhatsApp</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Campus UTT, Tizayuca, etc."
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Product Images (Max 5)
              </Typography>

              {errors.images && (
                <Typography variant="caption" color="error" display="block" mb={1}>
                  {errors.images}
                </Typography>
              )}

              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => fileInputRef.current.click()}
                  disabled={images.length >= 5}
                >
                  Upload
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Camera />}
                  onClick={() => cameraInputRef.current.click()}
                  disabled={images.length >= 5}
                >
                  Take Photo
                </Button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                />

                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleCameraCapture}
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                />
              </Box>

              {previewImages.length > 0 && (
                <Grid container spacing={2}>
                  {previewImages.map((src, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <ImagePreview src={src || "/placeholder.svg"} onRemove={() => removeImage(index)} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>

            <Grid item xs={12}>
              <LoadingButton
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                loading={loading}
                disabled={!isOnline}
              >
                List Product
              </LoadingButton>

              {!isOnline && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                  You are currently offline. Connect to the internet to post your product.
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  )
}

export default SellProduct

