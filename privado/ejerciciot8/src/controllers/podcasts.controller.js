import Podcast from '../models/podcast.model.js';

const getAll = async (req, res) => {
  try {
    const podcasts = await Podcast.find({ published: true }).populate('author', '-password');
    res.status(200).json(podcasts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id).populate('author', '-password');
    if (!podcast) return res.status(404).json({ message: 'Podcast no encontrado' });
    res.status(200).json(podcast);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const podcast = await Podcast.create({ ...req.body, author: req.user._id });
    res.status(201).json(podcast);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) return res.status(404).json({ message: 'Podcast no encontrado' });
    if (podcast.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const updated = await Podcast.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await Podcast.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Podcast eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAdminAll = async (req, res) => {
  try {
    const podcasts = await Podcast.find().populate('author', '-password');
    res.status(200).json(podcasts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const publish = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) return res.status(404).json({ message: 'Podcast no encontrado' });
    podcast.published = !podcast.published;
    await podcast.save();
    res.status(200).json(podcast);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { getAll, getOne, create, update, remove, getAdminAll, publish };