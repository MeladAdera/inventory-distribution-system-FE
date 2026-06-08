import { AxiosError } from 'axios';
import { ApiError } from '../types/api.types';

export function isAxiosError(error: unknown): error is AxiosError<ApiError> {
  return error instanceof AxiosError;
}

export function parseApiError(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) {
      return data.message;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function getErrorMessage(error: unknown): string {
  return parseApiError(error);
}
