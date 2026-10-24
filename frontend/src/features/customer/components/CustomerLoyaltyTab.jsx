import React from "react";
import { MembershipTierCard } from "./MembershipTierCard";

export function CustomerLoyaltyTab({ summary, user }) {
  return <MembershipTierCard summary={summary} user={user} />;
}
