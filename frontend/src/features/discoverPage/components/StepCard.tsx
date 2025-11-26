interface StepCardProps {
  step: number;
  title: string;
  description: string;
}

const StepCard = ({ step, title, description }: StepCardProps) => {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default StepCard;
