const Photo = require("../models/photo.model");
const Voter = require("../models/voter.model");
const sanitize = require("mongo-sanitize");
const requestIp = require("request-ip");
const path = require('path');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const cleanTitle = sanitize(req.fields.title);
    const cleanAuthor = sanitize(req.fields.author);
    const cleanEmail = sanitize(req.fields.email);
    const cleanFile = sanitize(req.files.file);

    if (!(cleanTitle && cleanAuthor && cleanEmail && cleanFile)) {
      throw new Error("Wrong input!");
    }

    const fileName = path.basename(cleanFile.path); // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
    const fileExt = path.extname(cleanFile.path).toLowerCase(); //rozszerzenie pliku np jpg.
        
    if (!(fileExt === ".jpg" || fileExt === ".png" || fileExt === ".gif")) {
      throw new Error("Wrong file! Put .jpg, .png or .gif!");
    }

    if (!(cleanTitle.length <= 25)) {
      //jeśli tytuł zdj jest większy niż 25 znaków (np. na Postmanie) to będzie błąd.
      throw new Error("Too long title! It must have maximum 25 signs!");
    }

    if (!(cleanAuthor.length <= 50)) {
      throw new Error("Too long author! It must have maximum 50 signs!");
    }

    const emailPattern = new RegExp(
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
      "g"
    );
    // regex dla email pattern, znalazłam tu: https://emailregex.com/    g oznacza global match.
    const emailTextMatched = cleanEmail.match(emailPattern).join("");
    if (emailTextMatched.length < cleanEmail.length)
      throw new Error("Invalid characters...");

    const newPhoto = new Photo({
      title: cleanTitle,
      author: cleanAuthor,
      email: cleanEmail,
      src: fileName,
      votes: 0,
    });
    await newPhoto.save(); // ...save new photo in DB
    res.json(newPhoto);
  } catch (err) {
    res.status(500).json(err.message);
    console.log('err:', err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if (!photoToUpdate) {
      res.status(404).json({ message: "Not found" });
    } else {
      const voterToUpdate = await Voter.findOne({
        user: requestIp.getClientIp(req),
      });
      if (voterToUpdate) {
        //dany adres IP już jest w bazie
        if (
          voterToUpdate.votes.some((x) => {
            return x == photoToUpdate._id;
          })
        ) {
          //kod sprawdzający, czy głosowano na wybrane zdjęcie. 'Some' daje 'true'.
          throw new Error("Vote already given to this photo!");
        } else {
          const t = 1.0 / 0.0;
          voterToUpdate.votes.push(photoToUpdate._id.toString()); //normalnie zwiększ liczbę głosów.
          voterToUpdate.save();
        }
      } else {
        //Jeśli nie, dodaj identyfikator zdjęcia do votes tego użytkownika
        const voter = new Voter({
          user: requestIp.getClientIp(req),
          votes: [photoToUpdate._id],
        });
        voter.save();
      }
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: "OK" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
