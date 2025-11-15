# 🤖 ML Spam Classifier Training Guide

## Overview

The spam filtering system uses a **two-layer approach**:

1. **Rule-Based Classifier** - Fast, deterministic, always available
2. **ML-Based Classifier** - Trained on datasets, improves accuracy over time

Both classifiers work together to provide the best spam detection accuracy.

---

## How It Works

### Combined Classification

When an email arrives:

1. **Rule-based analysis** - Checks keywords, patterns, headers
2. **ML prediction** - Analyzes text patterns using trained model
3. **Weighted combination** - Combines both predictions (60% ML, 40% rules)
4. **Final decision** - Determines if email is spam/promotion/ham

### Benefits

- ✅ **Better accuracy** - ML learns from patterns
- ✅ **Adapts over time** - Can be retrained with new data
- ✅ **Fallback protection** - Rule-based works even without ML model
- ✅ **Confidence scores** - ML provides probability scores

---

## Training the Model

### Option 1: Use Sample Dataset (Quick Start)

```bash
python scripts/train_spam_classifier.py --use-sample
```

This uses a small built-in dataset for testing.

### Option 2: Use Your Own Dataset

Create a CSV file with columns:

```csv
subject,body_text,body_html,from_email,label
"Need help","I need assistance",,"user@example.com",ham
"Special Sale","50% off everything",,"marketing@store.com",promotion
"Win $1000","Click here to claim",,"spam@example.com",spam
```

Then train:

```bash
python scripts/train_spam_classifier.py --dataset path/to/dataset.csv
```

### Option 3: Download Public Dataset

Popular spam datasets:

1. **SpamAssassin Public Corpus**
   - Download: https://spamassassin.apache.org/old/publiccorpus/
   - Contains thousands of spam and ham emails

2. **Enron Email Dataset**
   - Contains legitimate business emails
   - Can be combined with spam datasets

3. **Lingspam Dataset**
   - Linguistics spam dataset
   - Good for text-based classification

**Example: Using SpamAssassin**

```bash
# Download and extract
wget https://spamassassin.apache.org/old/publiccorpus/20030228_spam_2.tar.bz2
tar -xjf 20030228_spam_2.tar.bz2

# Convert to CSV format (you'll need a conversion script)
python scripts/convert_spamassassin_to_csv.py spam_2/ dataset.csv

# Train
python scripts/train_spam_classifier.py --dataset dataset.csv
```

---

## Dataset Format

### CSV Format

Required columns:
- `subject` - Email subject line
- `body_text` - Plain text body
- `body_html` - HTML body (optional)
- `from_email` - Sender email address
- `label` - Classification: `ham`, `spam`, or `promotion`

### Label Guidelines

- **ham** - Legitimate support emails, questions, requests
- **spam** - Scams, phishing, malicious content
- **promotion** - Marketing emails, newsletters, ads, deals

### Minimum Dataset Size

- **Recommended**: 1000+ emails per class
- **Minimum**: 100+ emails per class
- **Ideal**: 5000+ emails per class

---

## Training Process

### Step 1: Prepare Dataset

Ensure your dataset:
- ✅ Has balanced classes (similar number of ham/spam/promotion)
- ✅ Is clean (no empty emails)
- ✅ Has correct labels
- ✅ Is in CSV format

### Step 2: Train Model

```bash
python scripts/train_spam_classifier.py --dataset your_dataset.csv
```

### Step 3: Verify Training

Check the output:
```
Training completed!
Train accuracy: 0.9500
Test accuracy: 0.9200
Spam accuracy: 0.9500
Promotion accuracy: 0.8800
Ham accuracy: 0.9600
Model saved to models/spam_classifier.pkl
```

### Step 4: Test

The model is automatically loaded when the application starts. Test by sending emails and checking logs:

```
INFO: ML prediction: ml (confidence: 0.95)
INFO: Filtered spam email from spammer@example.com
```

---

## Model Architecture

### Algorithm: Multinomial Naive Bayes

- **Fast** - Quick predictions
- **Lightweight** - Small model size
- **Effective** - Good for text classification
- **Interpretable** - Can understand predictions

### Features

- **TF-IDF Vectorization** - Converts text to numerical features
- **N-gram Analysis** - Analyzes word combinations (1-2 grams)
- **Stop Word Removal** - Removes common words
- **Feature Selection** - Uses top 10,000 features

---

## Retraining

### When to Retrain

- ✅ After collecting new email data
- ✅ When accuracy drops
- ✅ When spam patterns change
- ✅ Monthly/quarterly maintenance

### Retraining Process

1. **Collect new data** - Gather recent emails (spam/ham/promotion)
2. **Label data** - Classify emails correctly
3. **Combine datasets** - Add to existing training data
4. **Retrain** - Run training script again
5. **Verify** - Test on new data

### Incremental Learning

For production, consider:
- Collecting filtered emails for review
- Manually labeling false positives/negatives
- Retraining monthly with new labeled data

---

## Configuration

### Enable/Disable ML Classifier

In `.env`:

```bash
# Enable ML classifier (requires trained model)
EMAIL_ML_CLASSIFIER_ENABLED=true
```

### Model Location

Default: `models/spam_classifier.pkl`

Change via:
```bash
python scripts/train_spam_classifier.py --dataset data.csv --model-path custom/path/model.pkl
```

---

## Performance

### Accuracy Expectations

With a good dataset:
- **Spam Detection**: 90-95% accuracy
- **Promotion Detection**: 85-90% accuracy
- **Ham Detection**: 95-98% accuracy

### Speed

- **Training**: 1-5 minutes (depending on dataset size)
- **Prediction**: <10ms per email
- **Model Size**: ~5-20 MB

---

## Troubleshooting

### "No trained ML model found"

**Solution**: Train a model first:
```bash
python scripts/train_spam_classifier.py --use-sample
```

### "ML prediction failed"

**Possible causes**:
- Model file corrupted
- Missing dependencies (scikit-learn)
- Invalid email format

**Solution**: Retrain the model or check dependencies

### Low Accuracy

**Solutions**:
1. **More training data** - Collect more emails
2. **Better labels** - Ensure correct classification
3. **Balanced dataset** - Equal samples per class
4. **Feature tuning** - Adjust TF-IDF parameters

### Model Not Loading

**Check**:
- Model file exists at `models/spam_classifier.pkl`
- File permissions are correct
- Dependencies installed: `pip install scikit-learn joblib`

---

## Advanced: Custom Training

### Modify Training Script

Edit `scripts/train_spam_classifier.py` to:
- Use different algorithms (SVM, Random Forest, etc.)
- Adjust TF-IDF parameters
- Add custom features
- Use different train/test split

### Example: Using SVM

```python
from sklearn.svm import SVC

# In train() method
self.model = Pipeline([
    ('tfidf', TfidfVectorizer(...)),
    ('classifier', SVC(kernel='linear', probability=True))
])
```

---

## Best Practices

1. **Start with sample** - Use `--use-sample` to test
2. **Collect real data** - Use your actual emails for better accuracy
3. **Label carefully** - Incorrect labels hurt accuracy
4. **Balance classes** - Similar number of each class
5. **Regular retraining** - Update model with new patterns
6. **Monitor performance** - Track false positives/negatives
7. **Keep backups** - Save model versions before retraining

---

## Integration with Rule-Based Classifier

The ML classifier **enhances** the rule-based classifier:

- **Rule-based** provides fast, deterministic filtering
- **ML-based** adds pattern recognition and learning
- **Combined** gives best of both worlds

If ML model is unavailable, the system falls back to rule-based only.

---

## Summary

✅ **Two-layer protection** - Rule-based + ML-based  
✅ **Trainable** - Improves with more data  
✅ **Fast** - <10ms per prediction  
✅ **Configurable** - Enable/disable via settings  
✅ **Fallback** - Works without ML model  

---

*For best results, train on your actual email data and retrain periodically.*

