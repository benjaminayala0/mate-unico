const ZONES = [
  { min: 1000, max: 1999, costo: 1800 },
  { min: 2000, max: 3499, costo: 2500 },
  { min: 3500, max: 4999, costo: 3200 }
];

export const calculateShipping = (req, res) => {
  const cp = Number(req.query.cp);

  const zona = ZONES.find(z => cp >= z.min && cp <= z.max);

  if (!zona) return res.json({ costo: 5000 });

  res.json({ costo: zona.costo });
};
