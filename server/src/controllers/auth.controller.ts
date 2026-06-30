import { Request, Response } from 'express'
import * as authService from '../services/auth.service'
import { ok, created, badRequest, serverError } from '../utils/response'

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.signup(req.body)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    created(res, { accessToken: result.accessToken, user: result.user })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Signup failed')
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    ok(res, { accessToken: result.accessToken, user: result.user })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Login failed')
  }
}

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) {
      badRequest(res, 'No refresh token')
      return
    }
    const result = await authService.refresh(token)
    ok(res, result)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Token refresh failed')
  }
}

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken
    if (token) await authService.logout(token)
    res.clearCookie('refreshToken')
    ok(res, null, 'Logged out')
  } catch {
    serverError(res, 'Logout failed')
  }
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth!.userId
    const user = await authService.getMe(userId)
    ok(res, user)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed to get user')
  }
}

export const checkEmailAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.query.email ?? '')
    if (!email) {
      res.status(400).json({ success: false, error: 'Email required' })
      return
    }
    const available = await authService.checkEmail(email)
    res.json({ success: true, data: { available } })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
}
