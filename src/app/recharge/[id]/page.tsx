import RechargeClient from "./RechargeClient";

export default function RechargePage({ params }: { params: { id: string } }) {
  return <RechargeClient id_bijou={params.id} />;
}
