"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { validateEmail } from "../../utils/validators"
import { toast } from "react-hot-toast"

const RegisterForm = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "estudiante", // Default role
    phone: "",
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Debe ser un correo institucional (@uttn.mx)"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria"
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El número de teléfono es obligatorio"
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Ingresa un número de teléfono válido (10 dígitos)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      await register(registerData)
      toast.success("Registro exitoso")
      navigate("/dashboard")
    } catch (error) {
      console.error("Error en registro:", error)
      toast.error(error.response?.data?.message || "Error al registrarse")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Registro en UTTianguis</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Nombre completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${errors.name ? "border-red-500" : "border-gray-300 focus:border-blue-500"}`}
            placeholder="Ingresa tu nombre completo"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Correo electrónico institucional
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${errors.email ? "border-red-500" : "border-gray-300 focus:border-blue-500"}`}
            placeholder="ejemplo@uttn.mx"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${errors.password ? "border-red-500" : "border-gray-300 focus:border-blue-500"}`}
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${errors.confirmPassword ? "border-red-500" : "border-gray-300 focus:border-blue-500"}`}
            placeholder="Confirma tu contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
            Rol en la institución
          </label>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                id="role-estudiante"
                name="role"
                type="radio"
                value="estudiante"
                checked={formData.role === "estudiante"}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="role-estudiante" className="ml-2 block text-sm text-gray-700">
                Estudiante
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="role-profesor"
                name="role"
                type="radio"
                value="profesor"
                checked={formData.role === "profesor"}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="role-profesor" className="ml-2 block text-sm text-gray-700">
                Profesor
              </label>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
            Número de teléfono (WhatsApp)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${errors.phone ? "border-red-500" : "border-gray-300 focus:border-blue-500"}`}
            placeholder="10 dígitos"
            value={formData.phone}
            onChange={handleChange}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          disabled={isLoading}
        >
          {isLoading ? "Registrando..." : "Registrarse"}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterForm

