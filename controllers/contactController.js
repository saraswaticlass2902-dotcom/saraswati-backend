////controllers/contactControoler.js  

import Contact from "../models/contactMessage.js";



export const submitMessage = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      age,
      type,
      message,
      captcha
    } = req.body;

    const newContact = new Contact({
      firstName,
      lastName,
      email,
      phone,
      age,
      type,
      message,
      captcha
    });

    await newContact.save();

    res.status(201).json({ success: true, message: "Message submitted successfully!" });
  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({ success: false, error: "Server error while submitting contact." });
  }
};




export const getAllMessages = async (req, res) => {
  try {
    const allContacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: allContacts });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to retrieve contact messages." });
  }
};


// controllers/contactController.js

// ...existing imports and functions...

export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};
