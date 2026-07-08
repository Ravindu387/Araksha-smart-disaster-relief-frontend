import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';
import { FileUploadService } from '../../Common/services/file-upload.service';
import { HttpEventType } from '@angular/common/http';

type Role = 'Citizen' | 'Volunteer';

interface SignupModel {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  agree: boolean;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html'
})
export class SignupComponent {
  step = 1;
  selectedRole: Role | null = null;
  isSubmitting = false;
  errorMessage = '';
  emailInvalid = false;
  confirmPassword = '';
  passwordMismatch = false;

  // Volunteer specific properties
  volunteerLocation = '';
  predefinedSkills = [
    'Medical', 'First Aid', 'Water Rescue', 'Search & Rescue', 
    'Construction', 'Logistics', 'Communications', 'Firefighting', 'General Support'
  ];
  selectedSkills: string[] = [];

  profilePhotoFile: File | null = null;
  profilePhotoUrl = '';
  profilePhotoProgress = 0;
  profilePhotoError = '';

  idVerificationDocFile: File | null = null;
  idVerificationDocUrl = '';
  idVerificationDocProgress = 0;
  idVerificationDocError = '';

  user: SignupModel = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    agree: false
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private fileUploadService: FileUploadService
  ) { }

  get hasMinLength(): boolean {
    return (this.user.password || '').length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.user.password || '');
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.user.password || '');
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.user.password || '');
  }

  get hasSpecial(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.user.password || '');
  }

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUppercase && this.hasLowercase && this.hasNumber && this.hasSpecial;
  }

  selectRole(role: Role) {
    this.selectedRole = role;
    this.errorMessage = '';
    this.emailInvalid = false;
    this.passwordMismatch = false;
    this.confirmPassword = '';
  }

  toggleSkill(skill: string): void {
    const idx = this.selectedSkills.indexOf(skill);
    if (idx >= 0) {
      this.selectedSkills.splice(idx, 1);
    } else {
      this.selectedSkills.push(skill);
    }
  }

  onProfilePhotoSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.profilePhotoFile = files[0];
      this.profilePhotoError = '';
      this.profilePhotoProgress = 0;
      this.uploadProfilePhoto();
    }
  }

  uploadProfilePhoto(): void {
    if (!this.profilePhotoFile) return;

    this.fileUploadService.uploadFile(this.profilePhotoFile, 'VOLUNTEER').subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.profilePhotoProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.profilePhotoUrl = event.body.fileUrl;
          this.profilePhotoProgress = 100;
        }
      },
      error: (err) => {
        this.profilePhotoProgress = 0;
        this.profilePhotoError = err.error?.error || 'Failed to upload photo';
      }
    });
  }

  removeProfilePhoto(): void {
    this.profilePhotoFile = null;
    this.profilePhotoUrl = '';
    this.profilePhotoProgress = 0;
    this.profilePhotoError = '';
  }

  onIdVerificationDocSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.idVerificationDocFile = files[0];
      this.idVerificationDocError = '';
      this.idVerificationDocProgress = 0;
      this.uploadIdVerificationDoc();
    }
  }

  uploadIdVerificationDoc(): void {
    if (!this.idVerificationDocFile) return;

    this.fileUploadService.uploadFile(this.idVerificationDocFile, 'VOLUNTEER').subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.idVerificationDocProgress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.idVerificationDocUrl = event.body.fileUrl;
          this.idVerificationDocProgress = 100;
        }
      },
      error: (err) => {
        this.idVerificationDocProgress = 0;
        this.idVerificationDocError = err.error?.error || 'Failed to upload document';
      }
    });
  }

  removeIdVerificationDoc(): void {
    this.idVerificationDocFile = null;
    this.idVerificationDocUrl = '';
    this.idVerificationDocProgress = 0;
    this.idVerificationDocError = '';
  }

  nextStep() {
    if (!this.selectedRole) {
      this.errorMessage = 'Please select a role.';
      return;
    }
    if (!this.user.firstName || !this.user.lastName) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
    if (!this.user.email) {
      this.errorMessage = 'Please enter your email address.';
      this.emailInvalid = true;
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.user.email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.emailInvalid = true;
      return;
    }
    this.emailInvalid = false;
    this.errorMessage = '';
    this.step = 2;
  }

  previousStep() {
    this.errorMessage = '';
    this.step = 1;
  }

  submit() {
    if (!this.user.agree || !this.selectedRole || this.isSubmitting) {
      return;
    }

    if (!this.isPasswordValid) {
      this.errorMessage = 'Password must meet all complexity requirements.';
      return;
    }

    if (this.user.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      this.passwordMismatch = true;
      return;
    }

    this.passwordMismatch = false;
    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService
      .register({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        password: this.user.password,
        role: this.selectedRole.toUpperCase(),
        phone: this.user.phone,
        location: this.selectedRole === 'Volunteer' ? this.volunteerLocation : undefined,
        skills: this.selectedRole === 'Volunteer' ? this.selectedSkills : undefined,
        profilePhotoUrl: this.selectedRole === 'Volunteer' ? this.profilePhotoUrl : undefined,
        idVerificationDocUrl: this.selectedRole === 'Volunteer' ? this.idVerificationDocUrl : undefined
      })
      .subscribe({
        next: (message: any) => {
          this.isSubmitting = false;
          if (message === 'Email already exists') {
            this.errorMessage = message;
            return;
          }
          this.router.navigate(['/login']);
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.errorMessage = 'Something went wrong. Please try again.';
          console.error(err);
        }
      });
  }
}