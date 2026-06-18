package pknu26.example.movie.service;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value; // 👈 추가 임포트
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import pknu26.example.movie.entity.Movie;
import pknu26.example.movie.repository.MovieRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MovieApiService {

    private final MovieRepository movieRepository;
    private final RestTemplate restTemplate = new RestTemplate(); 

    // ⚠️ [중요] 여기에 영진위 오픈 API 홈페이지에서 발급받은 실제 키(발급번호 문자열)를 넣으셔야 합니다!
    @Value("${kobis.api.key}") 
    private String API_KEY;
     
    private final String BASE_URL = "http://www.kofic.or.kr/koficopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json";

    @Transactional
    public void fetchAndSaveOneMonthData() {
        // 만약 키를 바꾸지 않았다면 미리 예외를 발생시켜 알려줍니다.
        if ("YOUR_KOFIC_API_KEY".equals(API_KEY)) {
            throw new IllegalStateException("KOFIC API Key가 설정되지 않았습니다. MovieApiService 상단의 API_KEY를 변경해 주세요.");
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        LocalDate today = LocalDate.now();

        System.out.println("🎬 영진위 API 데이터 수집을 시작합니다... (최근 30일)");

        for (int i = 1; i <= 30; i++) {
            String targetDate = today.minusDays(i).format(formatter);
            String url = String.format("%s?key=%s&targetDt=%s", BASE_URL, API_KEY, targetDate);

            try {
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);
                
                if (response == null || !response.containsKey("boxOfficeResult")) {
                    System.err.println("❌ [" + targetDate + "] API 응답 구조가 올바르지 않거나 키 인증에 실패했습니다.");
                    continue;
                }

                Map<String, Object> boxOfficeResult = (Map<String, Object>) response.get("boxOfficeResult");
                
                // 영진위가 에러 메시지를 보냈는지 확인
                if (boxOfficeResult.containsKey("faultInfo")) {
                    Map<String, Object> faultInfo = (Map<String, Object>) boxOfficeResult.get("faultInfo");
                    System.err.println("❌ [" + targetDate + "] API 오류 발생: " + faultInfo.get("message"));
                    continue;
                }

                List<Map<String, Object>> dailyBoxOfficeList = (List<Map<String, Object>>) boxOfficeResult.get("dailyBoxOfficeList");
                if (dailyBoxOfficeList == null) continue;

                int savedCount = 0;
                for (Map<String, Object> movieData : dailyBoxOfficeList) {
                    String movieNm = (String) movieData.get("movieNm");
                    
                    // 중복 체크 후 저장
                    if (movieRepository.findByTitleContainingIgnoreCase(movieNm).isEmpty()) {
                        Movie movie = new Movie();
                        movie.setTitle(movieNm);
                        
                        // 💡 프로젝트 요구사항 및 Entity 구조에 맞게 필요한 데이터 매핑 (예시)
                        // movie.setReleaseDate((String) movieData.get("openDt"));
                        
                        movieRepository.save(movie);
                        savedCount++;
                    }
                }
                System.out.println("✅ [" + targetDate + "] 수집 완료 (신규 적재: " + savedCount + "건)");
                
                Thread.sleep(150); // 영진위 서버 과부하 방지 텀 확장
                
            } catch (Exception e) {
                // 💡 에러 발생 시 추적이 쉽도록 스택 트레이스 전체 출력
                System.err.println("❌ [" + targetDate + "] 데이터 수집 실패 원인:");
                e.printStackTrace();
            }
        }
        System.out.println("🎉 최근 1달치 영화 데이터 MySQL 적재 작업 종료!");
    }
}