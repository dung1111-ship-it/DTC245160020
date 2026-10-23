/**
 * src/middleware/errorHandler.js
 * Lớp lỗi tùy biến ApiError, 404 handler và middleware bắt lỗi tập trung chuẩn JSON Envelope
 */

class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Dữ liệu yêu cầu không hợp lệ', details = null, code = 'VALIDATION_ERROR') {
    return new ApiError(400, message, code, details);
  }

  static notFound(message = 'Tài nguyên yêu cầu không tồn tại') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Dữ liệu bị trùng lặp hoặc xung đột ràng buộc', code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static internal(message = 'Đã xảy ra lỗi nội bộ máy chủ') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}

/**
 * Tiện ích bọc controller async loại bỏ try-catch thủ công
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Xử lý các route không tồn tại (404 Not Found)
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên máy chủ API`
    }
  });
}

/**
 * Middleware bắt lỗi trung tâm của Express
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  let errorCode = err.code;
  let message = err.message || 'Lỗi xử lý yêu cầu phía máy chủ';

  // Chuyển đổi mã lỗi SQLite
  if (err.code && typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
    statusCode = 400;
    if (err.code.includes('FOREIGNKEY')) {
      errorCode = 'VALIDATION_ERROR';
      message = 'Ràng buộc khóa ngoại không hợp lệ: Ví hoặc Danh mục không tồn tại';
    } else if (err.code.includes('UNIQUE')) {
      errorCode = 'CONFLICT';
      message = 'Dữ liệu đã tồn tại trong hệ thống (vi phạm tính duy nhất)';
    } else if (err.code.includes('CHECK')) {
      errorCode = 'VALIDATION_ERROR';
      message = 'Dữ liệu không thỏa mãn ràng buộc kiểm tra hợp lệ';
    } else {
      errorCode = 'BAD_REQUEST';
    }
  }

  if (!errorCode) {
    if (statusCode === 404) errorCode = 'NOT_FOUND';
    else if (statusCode === 400) errorCode = 'VALIDATION_ERROR';
    else if (statusCode === 409) errorCode = 'CONFLICT';
    else errorCode = 'INTERNAL_ERROR';
  }

  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message
    }
  };

  if (err.details) {
    errorResponse.error.details = err.details;
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = {
  ApiError,
  asyncHandler,
  notFoundHandler,
  errorHandler
};
