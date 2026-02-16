export const Card = ({ title, value, type }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    <h3
      className={`text-2xl font-bold mt-2 ${
        type === "income"
          ? "text-green-600"
          : type === "expense"
            ? "text-red-600"
            : ""
      }`}
    >
      {value}
    </h3>
  </div>
);
