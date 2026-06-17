import pandas as pd
from fetch_movies import fetch_tmdb, fetch_kobis

def test_dataframes_locally():
    print("=== 🎬 TMDB 영화 데이터프레임 확인 ===")
    movie_list = fetch_tmdb()
    movie_df = pd.DataFrame(movie_list)
    
    # DataFrame의 전체적인 정보(컬럼, 결측치, 데이터 타입) 출력
    print(movie_df.info())
    print("\n[데이터 샘플 상위 5개]")
    print(movie_df.head())

    print("\n" + "="*50 + "\n")

    print("=== 📊 KOBIS 박스오피스 데이터프레임 확인 ===")
    boxoffice_list = fetch_kobis()
    boxoffice_df = pd.DataFrame(boxoffice_list)
    
    print(boxoffice_df.info())
    print("\n[데이터 샘플 상위 5개]")
    print(boxoffice_df.head())

if __name__ == "__main__":
    test_dataframes_locally()