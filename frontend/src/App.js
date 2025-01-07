import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [files, setFiles] = useState([]);
    const [result, setResult] = useState(null);
    const [filterOption, setFilterOption] = useState('author');
    const [filterValue, setFilterValue] = useState('');
    const [filteredMentions, setFilteredMentions] = useState(null);
    const [filteredFiles, setFilteredFiles] = useState(null);
    const [mentionCount, setMentionCount] = useState(0);

    const handleFileChange = (event) => {
        setFiles(event.target.files);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Response:', response.data);
            setResult(response.data);
        } catch (error) {
            console.error('Error uploading files:', error);
        }
    };

    const handleFilterOptionChange = (event) => {
        setFilterOption(event.target.value);
    };

    const handleFilterValueChange = (event) => {
        setFilterValue(event.target.value);
    };

    const handleFilterSubmit = async (event) => {
        event.preventDefault();
        if (!result) return;

        try {
            const response = await axios.post('http://localhost:5000/filter', {
                filterOption,
                filterValue,
                clusters: result.clusters,
                file_mentions: result.file_mentions
            });
            console.log('Filtered Response:', response.data);
            setFilteredMentions(response.data.filtered_mentions);
            setFilteredFiles(response.data.filtered_files);
            setMentionCount(response.data.mention_count);
        } catch (error) {
            console.error('Error filtering results:', error);
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Cross Document Coreference Resolution (CDCR)</h1>
                <p>Upload PDFs to identify and link mentions of the same entity across multiple documents.</p>
            </header>
            <main>
                <section className="upload-section">
                    <h2>Upload PDFs</h2>
                    <form onSubmit={handleSubmit}>
                        <input type="file" multiple onChange={handleFileChange} />
                        <button type="submit">Upload</button>
                    </form>
                </section>
                {result && (
                    <section className="filter-section">
                        <h2>Filter Results</h2>
                        <form onSubmit={handleFilterSubmit}>
                            <label htmlFor="filterOption">Filter by: </label>
                            <select id="filterOption" value={filterOption} onChange={handleFilterOptionChange}>
                                <option value="author">Author</option>
                                <option value="title">Title</option>
                                <option value="keywords">Keywords</option>
                            </select>
                            <input
                                type="text"
                                placeholder={`Enter ${filterOption}`}
                                value={filterValue}
                                onChange={handleFilterValueChange}
                            />
                            <button type="submit">Filter</button>
                        </form>
                    </section>
                )}
                {filteredMentions && (
                    <section className="result-section">
                        <h2>Filtered Mentions</h2>
                        <ul>
                            {filteredMentions.map((mention, index) => (
                                <li key={index}>{mention}</li>
                            ))}
                        </ul>
                        <div className="summary">
                            <h3>Total Mentions: {mentionCount}</h3>
                        </div>
                    </section>
                )}
                {filteredFiles && (
                    <section className="file-section">
                        <h2>Files Containing Filtered Mentions</h2>
                        <ul>
                            {Object.entries(filteredFiles).map(([filename, mentions], index) => (
                                <li key={index}>
                                    <strong>
                                        <a href={`http://localhost:5000/pdf/${filename}`} target="_blank" rel="noopener noreferrer">
                                            {filename}
                                        </a>
                                    </strong>
                                    <ul>
                                        {mentions.map((mention, idx) => (
                                            <li key={idx}>{mention}</li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <section className="info-section">
                    <h2>About the Project</h2>
                    <p>Cross Document Coreference Resolution (CDCR) is a task in natural language processing (NLP) that involves identifying and linking mentions of the same entity across multiple documents. This is useful in various applications such as information retrieval, question answering, and summarization.</p>
                    <h3>Key Steps in CDCR:</h3>
                    <ul>
                        <li><strong>Mention Detection:</strong> Identify all mentions of entities in the documents.</li>
                        <li><strong>Mention Linking:</strong> Link mentions that refer to the same entity across different documents.</li>
                        <li><strong>Entity Clustering:</strong> Group linked mentions into clusters representing unique entities.</li>
                    </ul>
                    <h3>Techniques Used:</h3>
                    <ul>
                        <li><strong>Rule-based Methods:</strong> Use predefined rules to identify and link mentions.</li>
                        <li><strong>Machine Learning Models:</strong> Train models to learn patterns for mention detection and linking.</li>
                        <li><strong>Deep Learning Approaches:</strong> Use neural networks to capture complex relationships between mentions.</li>
                    </ul>
                    <h3>Algorithms and Techniques Used:</h3>
                    <ul>
                        <li><strong>Named Entity Recognition (NER):</strong> The <code>en_core_web_sm</code> model from spaCy is used for Named Entity Recognition (NER). This model is pre-trained on a large corpus of text and can identify entities such as persons, organizations, locations, dates, etc., in the text.</li>
                        <li><strong>Vectorization:</strong> The <code>TfidfVectorizer</code> from <code>scikit-learn</code> is used to convert the text mentions into numerical vectors. TF-IDF stands for Term Frequency-Inverse Document Frequency, which is a statistical measure used to evaluate the importance of a word in a document relative to a collection of documents (corpus).</li>
                        <li><strong>Clustering:</strong> The <code>AgglomerativeClustering</code> algorithm from <code>scikit-learn</code> is used to group the mentions into clusters. This is a type of hierarchical clustering that builds nested clusters by repeatedly merging or splitting them. The algorithm used here does not predefine the number of clusters (<code>n_clusters=None</code>) and uses a distance threshold (<code>distance_threshold=1.5</code>) to determine cluster formation.</li>
                    </ul>
                </section>
            </main>
        </div>
    );
}

export default App;