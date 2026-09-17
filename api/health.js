module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    service: "Archivery Backend",
    version: "0.1.0",
    groqConfigured: Boolean(process.env.GROQ_API_KEY)
  });
};
