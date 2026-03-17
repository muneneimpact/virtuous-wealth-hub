import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const PendingApproval = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="Virtuous Deca Investment" className="w-20 h-20 mx-auto" />
          <h1 className="font-display text-2xl font-bold text-primary-foreground mt-4">
            Virtuous Deca Investment
          </h1>
        </div>

        <Card variant="elevated">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-display font-bold">Account Pending Approval</h2>
            <p className="text-muted-foreground">
              Welcome, <span className="font-semibold">{profile?.display_name}</span>! Your account has been created and is awaiting admin approval.
            </p>
            {profile?.membership_number && (
              <p className="text-sm text-muted-foreground">
                Your Membership Number: <span className="font-mono font-bold text-foreground">{profile.membership_number}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              You'll be able to access your dashboard once an admin approves your membership.
            </p>
            <Button variant="outline" onClick={signOut} className="mt-4">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingApproval;
