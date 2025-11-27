import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { School, Award } from "lucide-react";

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [signUpData, setSignUpData] = useState({
    school_graduated: "",
    has_att_permit: false
  });
  const [signUpError, setSignUpError] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  const handleSignUpSuccess = async (user) => {
    // After base44 creates the account, update with additional fields
    setSignUpLoading(true);
    try {
      await base44.auth.updateMe({
        school_graduated: signUpData.school_graduated,
        has_att_permit: signUpData.has_att_permit,
        att_permit_date: signUpData.has_att_permit ? new Date().toISOString().split('T')[0] : null
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error updating user info:', error);
      setSignUpError('Account created but failed to save additional info. Please update in your profile.');
      setTimeout(() => onSuccess(), 2000);
    } finally {
      setSignUpLoading(false);
    }
  };

  const resetForm = () => {
    setSignUpData({
      school_graduated: "",
      has_att_permit: false
    });
    setSignUpError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Welcome to One Quest</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {signUpError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {signUpError}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-school">School/University Graduated *</Label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="signup-school"
                  type="text"
                  placeholder="e.g., University of California"
                  value={signUpData.school_graduated}
                  onChange={(e) => setSignUpData({...signUpData, school_graduated: e.target.value})}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
              <Checkbox
                id="att-permit"
                checked={signUpData.has_att_permit}
                onCheckedChange={(checked) => setSignUpData({...signUpData, has_att_permit: checked})}
              />
              <div className="flex-1">
                <label
                  htmlFor="att-permit"
                  className="text-sm font-medium leading-none cursor-pointer flex items-center"
                >
                  <Award className="w-4 h-4 mr-2 text-blue-600" />
                  I have authorization to take the ATT (Authorization to Test)
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Check this if you already have your ATT permit
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Click the button below to sign in or sign up using base44 authentication
            </p>
            <Button 
              onClick={() => {
                if (!signUpData.school_graduated) {
                  setSignUpError("Please enter your school/university before continuing");
                  return;
                }
                base44.auth.redirectToLogin(window.location.href);
              }} 
              className="w-full"
              disabled={signUpLoading}
            >
              Continue to Sign In / Sign Up
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}