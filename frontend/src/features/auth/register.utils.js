export function getPasswordStrength(pass) {
  if (!pass) return { score: 0, label: "", color: "bg-slate-200", text: "text-slate-400" };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 8) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 2) {
    return { score: 1, label: "Yếu", color: "bg-red-500", text: "text-red-500" };
  } else if (score <= 4) {
    return { score: 2, label: "Trung bình", color: "bg-amber-500", text: "text-amber-600" };
  } else {
    return { score: 3, label: "Mạnh", color: "bg-emerald-500", text: "text-emerald-600" };
  }
}

export function validateRegisterForm(formData) {
  const newErrors = {};

  if (!formData.fullName.trim()) {
    newErrors.fullName = "Họ và tên không được để trống";
  }

  const phoneRegex = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/;
  if (!formData.phone.trim()) {
    newErrors.phone = "Số điện thoại không được để trống";
  } else if (!phoneRegex.test(formData.phone.trim())) {
    newErrors.phone = "Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)";
  }

  if (!formData.username.trim()) {
    newErrors.username = "Tên đăng nhập không được để trống";
  } else if (formData.username.trim().length < 3) {
    newErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
    newErrors.username = "Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới";
  }

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    newErrors.email = "Email không đúng định dạng";
  }

  if (!formData.password) {
    newErrors.password = "Mật khẩu không được để trống";
  } else if (formData.password.length < 6) {
    newErrors.password = "Mật khẩu phải có tối thiểu 6 ký tự";
  }

  if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = "Xác nhận mật khẩu không trùng khớp";
  }

  return newErrors;
}
